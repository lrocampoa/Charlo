import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const chat = model.startChat({ history: [] });
    const result = await chat.sendMessage('Hello I want more info');
    console.log(result.response.text());
  } catch (e) {
    console.error("ERROR:", e);
  }
}

run();
