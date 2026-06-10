import { GoogleGenerativeAI, FunctionDeclaration } from '@google/generative-ai';
import { CUSTOMER_SERVICE_PROMPT } from './prompts';
import { trackGeminiUsage, createSessionTask } from '../firebase/dbUtils';

const createDraftEmailDeclaration: FunctionDeclaration = {
  name: "create_draft_email",
  description: "Creates a draft email task for a human agent to review and send. Use this whenever the user asks for information or documents to be sent to their email.",
  parameters: {
    type: "OBJECT" as any,
    properties: {
      to: { type: "STRING" as any, description: "The email address of the customer" },
      subject: { type: "STRING" as any, description: "The subject line of the email" },
      body: { type: "STRING" as any, description: "The full body of the email in HTML or plain text format" },
    },
    required: ["to", "subject", "body"],
  },
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function handleCustomerServiceQuery(
export async function handleCustomerServiceQuery(
  companyId: string,
  sessionId: string,
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
        model: 'gemini-flash-latest',
        systemInstruction: `${CUSTOMER_SERVICE_PROMPT}\n\nPersona Configured: ${persona}\n\nKnowledge Base:\n${knowledgeBaseContext}\n\nPERMANENT CRM FACTS ABOUT THIS USER:\n${JSON.stringify(crmFacts, null, 2)}\n\nIMPORTANT: If the user asks for an email to be sent, you must use the 'create_draft_email' tool to draft it. Do NOT say you cannot send emails.`,
        tools: [{ functionDeclarations: [createDraftEmailDeclaration] }]
      });
    }
  } else {
    model = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest',
      systemInstruction: `${CUSTOMER_SERVICE_PROMPT}\n\nPersona Configured: ${persona}\n\nKnowledge Base:\n${knowledgeBaseContext}\n\nPERMANENT CRM FACTS ABOUT THIS USER:\n${JSON.stringify(crmFacts, null, 2)}\n\nIMPORTANT: If the user asks for an email to be sent, you must use the 'create_draft_email' tool to draft it. Do NOT say you cannot send emails.`,
      tools: [{ functionDeclarations: [createDraftEmailDeclaration] }]
    });
  }

  try {
    const chat = model.startChat({ history: finalHistory });
    let result = await chat.sendMessage(userInput);
    
    // Check for function calls
    const functionCalls = result.response.functionCalls ? result.response.functionCalls() : undefined;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === "create_draft_email") {
        console.log(`[CustomerServiceAgent] Creating draft email for ${call.args.to}`);
        await createSessionTask(companyId, sessionId, {
          type: 'SEND_EMAIL',
          data: {
            to: call.args.to,
            subject: call.args.subject,
            body: call.args.body
          }
        });
        
        result = await chat.sendMessage([{
          functionResponse: {
            name: "create_draft_email",
            response: { success: true, message: "Email draft created and pending human review." }
          }
        }]);
      }
    }
    
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
