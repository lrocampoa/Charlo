import { GoogleGenerativeAI } from '@google/generative-ai';
import { SALES_PROMPT } from './prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function handleSalesQuery(
  userInput: string, 
  history: any[],
  productsCatalog: string,
  crmFacts: any = {}
) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3.5-flash',
    systemInstruction: `${SALES_PROMPT}\n\nProducts Available:\n${productsCatalog}\n\nPERMANENT CRM FACTS ABOUT THIS USER:\n${JSON.stringify(crmFacts, null, 2)}`
  });

  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userInput);
    return result.response.text();
  } catch (error) {
    console.error("Error in Sales Agent:", error);
    return "Lo siento, no pude procesar tu solicitud de compra.";
  }
}
