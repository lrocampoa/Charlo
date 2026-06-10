import { GoogleGenerativeAI, FunctionDeclaration } from '@google/generative-ai';
import { SALES_PROMPT } from './prompts';
import { createSessionTask } from '../firebase/dbUtils';

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

export async function handleSalesQuery(
  companyId: string,
  sessionId: string,
  userInput: string, 
  history: any[],
  productsCatalog: string,
  crmFacts: any = {},
  productsList: any[] = []
) {
  // Format the structured products database into a readable list for the AI
  let structuredProductsStr = "";
  if (productsList && productsList.length > 0) {
    structuredProductsStr = productsList.map(p => 
      `- **${p.name}**: ${p.price > 0 ? `${p.price} ${p.currency || ''}` : 'Precio a consultar'}\n  ${p.description || ''}`
    ).join('\n\n');
  }

  const combinedCatalog = [
    productsCatalog,
    structuredProductsStr ? `\n\n### Catálogo de Productos Estructurados:\n${structuredProductsStr}` : ''
  ].filter(Boolean).join('\n');

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-latest',
    systemInstruction: `${SALES_PROMPT}\n\nProducts Available:\n${combinedCatalog}\n\nPERMANENT CRM FACTS ABOUT THIS USER:\n${JSON.stringify(crmFacts, null, 2)}\n\nIMPORTANT: If the user asks for an email to be sent, you must use the 'create_draft_email' tool to draft it. Do NOT say you cannot send emails.`,
    tools: [{ functionDeclarations: [createDraftEmailDeclaration] }]
  });

  try {
    const chat = model.startChat({ history });
    let result = await chat.sendMessage(userInput);

    // Check for function calls
    const functionCalls = result.response.functionCalls ? result.response.functionCalls() : undefined;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === "create_draft_email") {
        const args = call.args as any;
        console.log(`[SalesAgent] Creating draft email for ${args.to}`);
        await createSessionTask(companyId, sessionId, {
          type: 'SEND_EMAIL',
          data: {
            to: args.to,
            subject: args.subject,
            body: args.body
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

    return result.response.text();
  } catch (error) {
    console.error("Error in Sales Agent:", error);
    return "Lo siento, no pude procesar tu solicitud de compra.";
  }
}
