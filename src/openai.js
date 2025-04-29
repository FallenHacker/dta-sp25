const fs   = require('fs');
const path = require('path');

require('dotenv').config({ path: '../.env.local' });

const axios = require('axios');

async function callOpenAI(userInput) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in the environment');
  }

  const url = 'https://api.openai.com/v1/chat/completions';

  const payload = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a Python code generation assistant specialized in creating trading strategies 
        using the vectorbt library. Your task is to carefully and accurately implement the trading strategy 
        described by the user. Your output must be pure, executable Python code that:
        - Must contain a function called run_strategy which exactly implements the user's strategy and the following specifications
        - run_strategy input: a pandas dataframe with the following data for every contract for a ticker over a certain period: contract_symbol, date, open, high, low, close, volume, strike_price, type, expiration_date, iv, delta, gamma, vega, theta
        - run_strategy output: a dictionary with keys “entries”, “exits”, and "size". Entries and exits map to pandas series or dataframes with their namesake results from the strategy, and size points to a scalar for the position size
        - Contains no additional explanations, comments, or markdown formatting
        - Prioritizes code correctness and strict alignment with the user instructions
        
        Only return the code, nothing else.`
      },
      {
        role: 'user',
        content: userInput
      }
    ],
    temperature: 0,
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    const raw = response.data.choices[0].message.content;
    const match = raw.match(/```(?:python)?\s*([\s\S]*?)\s*```/i);
    const cleanedResponse = match ? match[1].trim() : raw.trim();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename  = `run_strategy.py`;
    const outDir    = path.resolve(__dirname, '..', 'generated_strategies');
    fs.mkdirSync(outDir, { recursive: true });
    const outFile   = path.join(outDir, filename);
    fs.writeFileSync(outFile, cleanedResponse, 'utf8');
    console.log(`Wrote Python strategy to ${outFile}`);

    return filename;
  } catch (err) {
    console.error('Error calling OpenAI API:');
    throw err;
  }
}

module.exports = { callOpenAI };
