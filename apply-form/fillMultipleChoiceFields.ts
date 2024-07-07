import { Page } from 'puppeteer';
import selectors from '../selectors';

interface MultipleChoiceFields {
  [labelRegex: string]: string;
}

async function fillMultipleChoiceFields(page: Page, multipleChoiceFields: MultipleChoiceFields): Promise<void> {
  const selects = await page.$$(selectors.select);

  for (const select of selects) {
    const id = await select.evaluate((el) => el.id);
    const label = await page.$eval(`label[for="${id}"]`, (el) => el.innerText);

    let matched = false;
    for (const [labelRegex, value] of Object.entries(multipleChoiceFields)) {
      if (new RegExp(labelRegex, 'i').test(label)) {
        const option = await select.$$eval(selectors.option, (options, value) => {
          const option = (options as HTMLOptionElement[]).find((option) => option.value.toLowerCase() === value.toLowerCase());
          return option && option.value;
        }, value);

        if (option) {
          await select.select(option);
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      // Default to "Yes" if no matching label is found in multipleChoiceFields
      const defaultOption = await select.$$eval(selectors.option, (options) => {
        const option = (options as HTMLOptionElement[]).find((option) => option.value.toLowerCase() === "yes");
        return option && option.value;
      }, "Yes");

      if (defaultOption) {
        await select.select(defaultOption);
      }
    }
  }
}


export default fillMultipleChoiceFields;
