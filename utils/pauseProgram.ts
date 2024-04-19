// import ask from "./ask";
import readline from 'readline';

/**
 * Creates a readline interface and waits for the user to enter '1'.
 * @param question The prompt message to display.
 * @returns A promise that resolves when the user enters '1'.
 */
function waitForInputOne(question: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    const ask = () => {
      rl.question(question, (answer) => {
        if (answer === '1') {
          rl.close();
          resolve();
        } else {
          console.log("Invalid input. Please enter '1' to continue.");
          ask();  // Ask again
        }
      });
    };
    ask();
  });
}
/**
 * Pauses the execution of the program until the user presses Enter.
 * This function logs a message to indicate that the program is paused,
 * waits for the user to press Enter, and then logs that the program is continuing.
 */
export const pauseProgram = async (): Promise<void> => {
  console.log("Program is paused. Press 1 to continue... (might appear as '11' in the console)");

  // await ask("Press Enter to continue the program...");
  await waitForInputOne("Enter '1' to continue the program: ");

  console.log("Continuing...");
}