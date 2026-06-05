import { GoogleGenerativeAI } from '@google/generative-ai';
import { ROUTER_AGENT_PROMPT } from './prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function routeUserIntent(userInput: string) {
  // Use a fast, cost-effective model like Flash for intent routing
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: ROUTER_AGENT_PROMPT 
  });

  try {
    const result = await model.generateContent(userInput);
    const responseText = result.response.text();
    
    // Parse the JSON and clean any markdown blocks from the response
    const jsonString = responseText.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(jsonString);
    
    return parsed;
  } catch (error) {
    console.error("Failed to route intent:", error);
    // Fallback safely to customer service
    return {
      detectedLanguage: "es",
      intent: "CUSTOMER_SERVICE",
      confidence: 0,
      reasoning: "Fallback due to error"
    };
  }
}
