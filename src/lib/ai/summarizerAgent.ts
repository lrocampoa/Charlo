import { GoogleGenerativeAI } from '@google/generative-ai';
import { SUMMARIZER_AGENT_PROMPT } from './prompts';
import { getRawSessionHistory, getCustomerProfile, updateCustomerProfile } from '../firebase/dbUtils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Reviews a chat transcript and extracts permanent facts to save into the user's CRM profile.
 */
export async function runSummarizerAgent(companyId: string, customerId: string) {
  try {
    // 1. Fetch raw session history (to get the latest transcript)
    const rawHistory = await getRawSessionHistory(companyId, customerId);
    if (!rawHistory || !rawHistory.history || rawHistory.history.length === 0) return;

    // Convert history array to a readable transcript string for the AI
    const transcript = rawHistory.history.map((msg: any) => `${msg.role.toUpperCase()}: ${msg.parts[0].text}`).join('\n');

    // 2. Fetch existing CRM profile
    const existingProfile = await getCustomerProfile(companyId, customerId);
    const existingFacts = existingProfile?.extractedFacts || {};

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.5-flash',
      systemInstruction: `${SUMMARIZER_AGENT_PROMPT}\n\nEXISTING FACTS (DO NOT DUPLICATE THESE):\n${JSON.stringify(existingFacts, null, 2)}`
    });

    const result = await model.generateContent(`Here is the conversation transcript:\n\n${transcript}`);
    const responseText = result.response.text();
    
    // Parse the JSON
    const jsonString = responseText.replace(/```json\n?|```/g, '').trim();
    const newFacts = JSON.parse(jsonString);

    if (Object.keys(newFacts).length > 0) {
      // Merge old facts with new facts
      const mergedFacts = { ...existingFacts, ...newFacts };
      
      // Handle arrays being overwritten instead of merged
      for (const key in newFacts) {
         if (Array.isArray(newFacts[key]) && Array.isArray(existingFacts[key])) {
            mergedFacts[key] = Array.from(new Set([...existingFacts[key], ...newFacts[key]]));
         }
      }

      console.log(`[CRM ALERT] New facts learned for ${customerId}:`, newFacts);
      await updateCustomerProfile(companyId, customerId, mergedFacts);
    }
  } catch (error) {
    console.error("Failed to run Summarizer analysis:", error);
  }
}
