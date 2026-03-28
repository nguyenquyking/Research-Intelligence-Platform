const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  const modelsToTry = [
    "gemini-1.5-flash",
    "models/gemini-1.5-flash",
    "gemini-2.0-flash-exp",
    "models/gemini-2.0-flash-exp",
    "gemini-2.5-flash",
    "models/gemini-2.5-flash"
  ];
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hi");
      console.log(`✅ Success with ${modelName}`);
      break;
    } catch (e) {
      console.error(`❌ Failed with ${modelName}: ${e.message}`);
    }
  }
}

listModels();
