const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Just to test init
    // Actually we can list models using REST API to be safe, since SDK might not have listModels easily exposed
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("Available Models for generateContent:");
    data.models.forEach(m => {
        if (m.supportedGenerationMethods.includes("generateContent")) {
            console.log(`- Name: ${m.name}`);
        }
    });
  } catch (err) {
    console.error(err);
  }
}
run();
