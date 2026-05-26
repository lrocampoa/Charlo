import { GoogleGenerativeAI } from '@google/generative-ai';
import { BOOKING_PROMPT } from './prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function handleBookingQuery(
  userInput: string, 
  history: any[],
  calendlyLink: string,
  crmFacts: any = {}
) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3.5-flash',
    systemInstruction: `${BOOKING_PROMPT}\n\nYour Calendly Link: ${calendlyLink}\n\nPERMANENT CRM FACTS ABOUT THIS USER:\n${JSON.stringify(crmFacts, null, 2)}`
  });

  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userInput);
    return result.response.text();
  } catch (error) {
    console.error("Error in Booking Agent:", error);
    return "Lo siento, tuve un problema accediendo al calendario. ¿Podrías intentar más tarde?";
  }
}
