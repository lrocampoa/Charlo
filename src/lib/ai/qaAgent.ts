import { GoogleGenerativeAI } from '@google/generative-ai';
import { QA_AGENT_PROMPT } from './prompts';
import { getRawSessionHistory, saveKnowledgeGap } from '../firebase/dbUtils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Reviews a chat transcript and flags if there are any missing procedures/SOPs
 * that the AI failed to answer due to a lack of knowledge.
 */
export async function runQAAnalysis(companyId: string, sessionId: string) {
  try {
    const rawHistory = await getRawSessionHistory(companyId, sessionId);
    if (!rawHistory || !rawHistory.history || rawHistory.history.length === 0) return { knowledgeGapFound: false };

    const transcript = rawHistory.history.map((msg: any) => `${msg.role.toUpperCase()}: ${msg.parts[0].text}`).join('\n');

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: QA_AGENT_PROMPT,
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(`The AI in this conversation flagged a KNOWLEDGE_GAP because it lacked an SOP. Here is the transcript:\n\n${transcript}`);
    const responseText = result.response.text();
    
    // Parse the JSON directly since responseMimeType guarantees JSON
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      console.warn("Direct JSON parse failed, attempting regex cleanup...", e);
      const jsonString = responseText.replace(/```json\n?|```/g, '').trim();
      parsed = JSON.parse(jsonString);
    }
    
    // We force knowledgeGapFound to true because orchestrator only calls this if KNOWLEDGE_GAP was emitted
    parsed.knowledgeGapFound = true;

    if (parsed.knowledgeGapFound) {
      console.log(`[QA ALERT] Missing SOP Flagged: ${parsed.missingSopTitle}`);
      console.log(`Severity: ${parsed.severity} | Description: ${parsed.description}`);
      
      await saveKnowledgeGap(companyId, {
         missingSopTitle: parsed.missingSopTitle || "Unknown Missing Procedure",
         description: parsed.description || "The AI flagged a KNOWLEDGE_GAP here.",
         severity: parsed.severity || "MEDIUM"
      });
    }
    
    return parsed;
  } catch (error) {
    console.error("Failed to run QA analysis:", error);
    return { knowledgeGapFound: false };
  }
}
