import { OpenAI } from 'openai';  // Named import for OpenAIApi


// Create an instance of OpenAI using the constructor
const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Pass the API key directly to the OpenAI constructor
  });

export { openaiClient }; // Export the client instance for use elsewhere