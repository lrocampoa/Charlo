import { GoogleGenerativeAI } from '@google/generative-ai';
import { CUSTOMER_SERVICE_PROMPT } from './prompts';
import { trackGeminiUsage } from '../firebase/dbUtils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function handleCustomerServiceQuery(
  companyId: string,
  userInput: string, 
  history: any[],
  knowledgeBaseContext: string, 
  persona: string = "Pura vida and friendly",
  crmFacts: any = {},
  geminiCacheId?: string
) {
  let model;
  let finalHistory = [...history];

  if (geminiCacheId) {
    try {
      model = genAI.getGenerativeModelFromCachedContent({ name: geminiCacheId } as any);
      // Inject dynamic CRM facts into the start of the history
      finalHistory = [
        { role: 'user', parts: [{ text: `[SYSTEM] PERMANENT CRM FACTS ABOUT THIS USER:\n${JSON.stringify(crmFacts, null, 2)}` }] },
        { role: 'model', parts: [{ text: 'Understood.' }] },
        ...history
      ];
    } catch (e) {
      console.error("Cache expired or not found. Falling back to un-cached model.", e);
      // Fallback
      model = genAI.getGenerativeModel({ 
        model: 'gemini-3.5-flash',
        systemInstruction: `${CUSTOMER_SERVICE_PROMPT}\n\nPersona Configured: ${persona}\n\nKnowledge Base:\n${knowledgeBaseContext}\n\nPERMANENT CRM FACTS ABOUT THIS USER:\n${JSON.stringify(crmFacts, null, 2)}`
      });
    }
  } else {
    model = genAI.getGenerativeModel({ 
      model: 'gemini-3.5-flash',
      systemInstruction: `${CUSTOMER_SERVICE_PROMPT}\n\nPersona Configured: ${persona}\n\nKnowledge Base:\n${knowledgeBaseContext}\n\nPERMANENT CRM FACTS ABOUT THIS USER:\n${JSON.stringify(crmFacts, null, 2)}`
    });
  }

  try {
    const chat = model.startChat({ history: finalHistory });
    const result = await chat.sendMessage(userInput);
    
    // Track Gemini Usage
    const tokensUsed = result.response.usageMetadata?.totalTokenCount || 0;
    if (companyId && tokensUsed > 0) {
      trackGeminiUsage(companyId, tokensUsed).catch(err => console.error(err));
    }

    return result.response.text();
  } catch (error) {
    console.error("Error in Customer Service Agent:", error);
    return "Lo siento, tuve un problema procesando tu mensaje. ¿Podrías intentar de nuevo?";
  }
}
