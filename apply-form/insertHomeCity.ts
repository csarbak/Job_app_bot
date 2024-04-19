import { ElementHandle, Page } from 'puppeteer';
import selectors from '../selectors';
import changeTextInput from './changeTextInput';
import message from '../utils/message';
import wait from '../utils/wait';

async function insertHomeCity(page: Page, homeCity: string): Promise<void> {
  await changeTextInput(page, selectors.homeCity, homeCity);

  let homeTextInput = await page.$(selectors.homeCity) as ElementHandle;
  let cityDropdown = null;
  for (let i = 0; i < 5; i++) { // Try 5 times to find the city dropdown
    await homeTextInput.type(" ", {delay: 100}); // Simulate a space keypress
    cityDropdown = await page.$(selectors.cityDropdown);

    if (cityDropdown) {
      message('cityDropdown found!');
      break; // Exit the loop if the dropdown is found
    } else {
      message(`cityDropdown not found, attempt ${i + 1}/5. Retrying...`);
      await wait(2000) // Wait for 2 seconds before retrying
    }
  }

  if (!cityDropdown) {
    console.error('Failed to find the city dropdown after 5 attempts.');
    // await page.close();
    return; 
  }

  const cityOptions = await cityDropdown.$$(selectors.cityDropdownOption);
  for (const option of cityOptions) {  // find first city which matches the homeCity
    const textContent = await option.evaluate(el => el.textContent);
    if (textContent && textContent.includes(homeCity)) {
      message(`City found: ${textContent.trim()}`);
      await option.click();
      break;
    }
  }
}

export default insertHomeCity;
