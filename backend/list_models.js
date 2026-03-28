const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listAllModels() {
  try {
    const adminModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Not used for listModels
    // The standard SDK doesn't have a direct 'listModels' on the main client sometimes?
    // Wait, let's use the REST API via axios to list models for this API key.
    const axios = require('axios');
    const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (e) {
    console.error("Failed to list models:", e.response?.data || e.message);
  }
}

listAllModels();
