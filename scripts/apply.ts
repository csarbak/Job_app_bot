import puppeteer, { BrowserContext, Page } from "puppeteer";
import config from "../config";

import ask from "../utils/ask";
import message from "../utils/message";
import login from "../login";
import apply, { ApplicationFormData } from "../apply";
import fetchJobLinksUser, { date_posted } from "../fetch/fetchJobLinksUser";
import readline from "readline";
import setupSigintHandler from "../utils/setupSigintHandler";

interface AppState {
  paused: boolean;
}

const wait = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

const state: AppState = {
  paused: false,
};
var submittedJobs=0;


const askForPauseInput = async () => {
  await ask("press enter to pause the program");

  state.paused = true;

  await ask("finishing job application...\n");

  state.paused = false;
  message("unpaused");

  askForPauseInput();
};

(async () => {
  
  const testMode = process.argv[2] != "SUBMIT";
  const browser = await puppeteer.launch({
    headless: false,
    ignoreHTTPSErrors: true,
    args: ["--disable-setuid-sandbox", "--no-sandbox",],
    userDataDir: testMode ? './testingModeDataDir' : undefined, // Specify a path for storing user data while testing
    handleSIGINT: false,
  });
  
  await setupSigintHandler(browser);


  const context: BrowserContext | null = testMode ? await browser.defaultBrowserContext() : await browser.createIncognitoBrowserContext();
  const listingPage = await context.newPage();

  const pages = await browser.pages();

  await pages[0].close();

  await login({
    page: listingPage,
    email: config.LINKEDIN_EMAIL,
    password: config.LINKEDIN_PASSWORD,
  });

  askForPauseInput();

  const linkGenerator = fetchJobLinksUser({
    page: listingPage,
    location: config.LOCATION,
    keywords: config.KEYWORDS,
    datePosted: config.DATE_POSTED as date_posted,
    workplace: {
      remote: config.WORKPLACE.REMOTE,
      onSite: config.WORKPLACE.ON_SITE,
      hybrid: config.WORKPLACE.HYBRID,
    },
    jobTitle: config.JOB_TITLE,
    jobDescription: config.JOB_DESCRIPTION,
    jobDescriptionLanguages: config.JOB_DESCRIPTION_LANGUAGES
  });

  let applicationPage: Page | null = null;

  for await (const [link, title, companyName] of linkGenerator) {
    if (!applicationPage || process.env.SINGLE_PAGE !== "true")
      applicationPage = await context.newPage();

    await applicationPage.bringToFront();

    try {
      const formData: ApplicationFormData = {
        phone: config.PHONE,
        cvPath: config.CV_PATH,
        homeCity: config.HOME_CITY,
        coverLetterPath: config.COVER_LETTER_PATH,
        yearsOfExperience: config.YEARS_OF_EXPERIENCE,
        languageProficiency: config.LANGUAGE_PROFICIENCY,
        requiresVisaSponsorship: config.REQUIRES_VISA_SPONSORSHIP,
        booleans: config.BOOLEANS,
        textFields: config.TEXT_FIELDS,
        multipleChoiceFields: config.MULTIPLE_CHOICE_FIELDS,
      };

      await apply({
        page: applicationPage,
        link,
        formData,
        shouldSubmit: process.argv[2] === "SUBMIT",
      });


      if (process.argv[2] === "SUBMIT") {
        message(`Applied to ${title} at ${companyName}`);
        submittedJobs ++;
        console.log(`SUBMITTED JOBS : ${submittedJobs}`)
        //await applicationPage.close();
      } else {
        message('In test mode: Not submitting application.');
        submittedJobs ++;
        console.log(`SUBMITTED JOBS : ${submittedJobs}`)
        //await applicationPage.close();

      }
    } catch(e) {
      message(e as Error);
      message(`Error applying to ${title} at ${companyName}`);
    }

    await listingPage.bringToFront();

    for (let shouldLog = true; state.paused; shouldLog = false) {
      shouldLog && message("\nProgram paused, press enter to continue the program");
      await wait(2000);
    }
  }

  message("Closing browser");
  await browser.close(); 

})();
