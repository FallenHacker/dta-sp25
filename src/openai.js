const fs   = require('fs');
const path = require('path');

require('dotenv').config();

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
        using the vectorbt library, operating on standard OHLCV stock data.
        Your task is to carefully and accurately implement the trading strategy described by the user.
        Your output must be pure, executable Python code that:
        
        - Must contain a function called run_strategy which exactly implements the user's strategy and the following specifications.
        - run_strategy input: a pandas dataframe indexed by date, containing columns: 'open', 'high', 'low', 'close', 'volume'. Assume daily frequency unless specified otherwise by user.
        - run_strategy output: a dictionary with keys “entries”, “exits”, and optionally "size". Entries and exits map to boolean pandas Series aligned with the input dataframe index indicating trade signals. "size" maps to a scalar (e.g., 1) or a pandas Series for position size (if not provided, size 1 will be assumed).
        - Contains no additional explanations, comments, or markdown formatting - only the Python code block.
        - Strictly use only the provided input dataframe columns ('open', 'high', 'low', 'close', 'volume') for calculations. Do not assume other columns like options greeks, IV, or contract details exist.
        - Prioritizes code correctness and strict alignment with the user instructions.
        
        Only return the raw Python code, nothing else.`
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
