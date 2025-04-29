
const { callOpenAI } = require('./openai.js');

async function runTests() {
  const testInputs = [
    "buy when the 14-day RSI crosses below 30 and sells when it crosses above 70. Apply this on daily close prices",
    "Enters a long position when the 20-day SMA crosses above the 50-day, and exits when the 20-day SMA crosses below the 50-day",
  ];

  for (const input of testInputs) {
    console.log(`\nUSER: ${input}`);
    try {
      const response = await callOpenAI(input);
      console.log(`GPT: ${response}`);
    } catch (err) {
      console.error(`Error: ${err.message || 'An error occurred while calling OpenAI API'}`);
    }
  }
}

runTests();
