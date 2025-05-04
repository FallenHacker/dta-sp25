// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { callOpenAI } = require('./src/openai'); // Ensure this path is correct

const app = express();

// --- Explicit CORS Configuration ---
const corsOptions = {
  origin: 'http://localhost:3000', // Allow only the React app origin
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Explicitly allow methods
  credentials: true, // If you need cookies/authorization headers
  optionsSuccessStatus: 200 // Return 200 for OPTIONS preflight requests
};
console.log("Applying CORS options:", corsOptions);
app.use(cors(corsOptions));
// --- End CORS Configuration ---


// --- Request/Response Logging Middleware ---
app.use((req, res, next) => {
  console.log(`\n--- Incoming Request ---`);
  console.log(`${req.method} ${req.originalUrl}`);
  console.log("Origin:", req.headers.origin); // Log the origin header from the request
  // Log response headers just before they are sent
  const originalSend = res.send;
  res.send = function (body) {
    console.log(`--- Outgoing Response ---`);
    console.log("Status Code:", res.statusCode);
    console.log("Response Headers:", res.getHeaders()); // Log outgoing headers
    originalSend.call(this, body);
  };
   const originalJson = res.json;
   res.json = function (body) {
     console.log(`--- Outgoing Response ---`);
     console.log("Status Code:", res.statusCode);
     console.log("Response Headers:", res.getHeaders()); // Log outgoing headers
     originalJson.call(this, body);
   };
  next(); // Pass control to the next middleware/route handler
});
// --- End Logging Middleware ---


app.use(express.json()); // Parse JSON bodies

// Health-check route
app.get('/', (req, res) => {
  console.log("Handling GET / request");
  res.send('🤖 OpenAI API server is running');
});

// Your POST endpoint
app.post('/api/generate', async (req, res) => {
  console.log("Handling POST /api/generate request");
  console.log("Request Body:", req.body);
  const { prompt } = req.body;
  if (!prompt) {
    console.log("Missing prompt, sending 400");
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    console.log("Calling OpenAI with prompt:", prompt);
    const filename = await callOpenAI(prompt);
    console.log("OpenAI call successful, sending filename:", filename);
    res.status(200).json({ filename }); // Ensure status is 200 OK
  } catch (err) {
    console.error('OpenAI error in /api/generate:', err);
    // Ensure error response is stringified or simplified if it's complex
    const errorMessage = err.message || 'An internal server error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

const PORT = process.env.PORT || 5002; // Use port 5002
app.listen(PORT, () =>
  console.log(`🚀 Server listening on http://localhost:${PORT}`)
);