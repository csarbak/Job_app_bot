import readline from 'readline';
import message from './message';
import { Browser } from 'puppeteer';

/*
  * This function sets up a SIGINT handler to close the browser when the user presses CTRL+C.
  * Made because sometimes the browser doesn't close properly when the user presses CTRL+C, leading to zombie processes.
  * @param {Browser} browser - The puppeteer browser instance to close.
*/
export default function setupSigintHandler(browser: Browser) {
  if (process.platform === 'win32') {
    readline.createInterface({
      input: process.stdin,
      output: process.stdout
    }).on('SIGINT', () => {
      process.emit('SIGINT');
    });
  }

  process.on('SIGINT', async () => {
    try {
      if (browser) {
        message('CTRL+C pressed. Closing the browser... An error message may appear and is expected.');
        await browser.close(); // closes all chromium instances
      } else {
        message('No browser to close. Exiting...');
      }
    } catch (error) {
      console.error('Error closing the browser:', error);
    }
    message('Exiting...');
    process.exit(0);
  });

}

