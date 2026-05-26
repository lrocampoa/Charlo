import { GoogleGenerativeAI } from '@google/generative-ai';
import { CUSTOMER_SERVICE_PROMPT } from './prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function handleCustomerServiceQuery(
  userInput: string, 
  history: any[],
  knowledgeBaseContext: string, 
  persona: string = "Pura vida and friendly",
  crmFacts: any = {}
) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3.5-flash',
    systemInstruction: `${CUSTOMER_SERVICE_PROMPT}\n\nPersona Configured: ${persona}\n\nKnowledge Base:\n${knowledgeBaseContext}\n\nPERMANENT CRM FACTS ABOUT THIS USER:\n${JSON.stringify(crmFacts, null, 2)}`
  });

  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userInput);
    return result.response.text();
  } catch (error) {
    console.error("Error in Customer Service Agent:", error);
    return "Lo siento, tuve un problema procesando tu mensaje. ¿Podrías intentar de nuevo?";
  }
}
