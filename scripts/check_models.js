require('dotenv').config({ path: './backend/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No GEMINI_API_KEY found in .env');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // There is no direct listModels in the high-level SDK easily accessible, 
    // but we can try to fetch it via the REST API using the key.
    const axios = require('axios');
    const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    console.log('Available Models:');
    response.data.models.forEach(m => {
      console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
    });
  } catch (error) {
    console.error('Error fetching models:', error.response?.data || error.message);
  }
}

listModels();
