import { routeUserIntent } from './routerAgent';
import { handleCustomerServiceQuery } from './customerServiceAgent';
import { handlePaymentImage } from './paymentAgent';
import { handleSalesQuery } from './salesAgent';
import { handleBookingQuery } from './bookingAgent';
import { getSessionHistory, saveSessionMessage, getCustomerProfile, getRawSessionHistory, updateSessionStatus } from '../firebase/dbUtils';
import { runSummarizerAgent } from './summarizerAgent';
import { runQAAnalysis } from './qaAgent';

export async function processUserMessage(
  companyId: string,
  sessionId: string,
  message: string, 
  context: { 
    knowledgeBase: string; 
    productsCatalog: string; 
    calendlyLink: string; 
    persona: string;
    geminiCacheId?: string;
  },
  imagePart?: { data: string, mimeType: string } | null,
  platform: "whatsapp" | "web" = "whatsapp"
) {
  console.log(`[Orchestrator] Processing message for company ${companyId}, session ${sessionId}`);

  // 0. Save User Message to Short-Term Memory FIRST
  // This ensures human operators can see incoming messages even if AI is disabled
  await saveSessionMessage(companyId, sessionId, "user", message, platform, sessionId);

  // 0.5 Check session status
  const sessionDoc = await getRawSessionHistory(companyId, sessionId);
  const status = sessionDoc?.status || 'ai_handling';

  if (status === 'human_handling') {
    console.log(`🔇 Session ${sessionId} is in 'human_handling' mode. AI will ignore.`);
    return { response: null };
  }

  // 1. Fetch Short-Term Memory (Today's History)
  const history = await getSessionHistory(companyId, sessionId);

  // Gemini's ChatSession will append the new userInput automatically via `sendMessage`.
  // Since we already saved the message to DB, it is currently the last element in `history`.
  // We must remove it from `history` before passing it to `startChat` to prevent a 'roles must alternate' error.
  if (history.length > 0 && history[history.length - 1].role === 'user') {
    history.pop();
  }

  // 2. Fetch Long-Term Memory (CRM Facts)
  const crmProfile = await getCustomerProfile(companyId, sessionId);
  const crmFacts = crmProfile?.extractedFacts || {};

  // 3. Route User Intent (Stateless, based on latest message)
  const routing = await routeUserIntent(message);
  console.log(`[Orchestrator] Detected Intent: ${routing.intent}`);
  
  let response = "";

  // 3.5 Intercept Image Uploads
  if (imagePart) {
    console.log(`[Orchestrator] Intercepted image for payment validation`);
    response = await handlePaymentImage(companyId, sessionId, imagePart);
    
    // Save Interaction for model only (user message was saved above)
    await saveSessionMessage(companyId, sessionId, "model", response, platform, sessionId);
    return { routing: { intent: "PAYMENT" }, response };
  }
  
  // 4. Call Specialized Agent with History and CRM Facts
  switch (routing.intent) {
    case "CUSTOMER_SERVICE":
      response = await handleCustomerServiceQuery(message, history, context.knowledgeBase, context.persona, crmFacts, context.geminiCacheId);
      break;
    case "SALES":
      response = await handleSalesQuery(message, history, context.productsCatalog, crmFacts);
      break;
    case "BOOKING":
      response = await handleBookingQuery(message, history, context.calendlyLink, crmFacts);
      break;
    case "ESCALATION":
      response = "Entiendo su frustración. Un agente humano se pondrá en contacto con usted en breve.";
      await updateSessionStatus(companyId, sessionId, "needs_human");
      break;
    case "PAYMENT":
      response = "Por favor, envíe una captura de pantalla del comprobante de SINPE Móvil para verificar el pago.";
      break;
    default:
      response = await handleCustomerServiceQuery(message, history, context.knowledgeBase, context.persona, crmFacts, context.geminiCacheId);
      break;
  }
  
  // 5. Save Interaction to Short-Term Memory
  // Note: user message is already saved at the beginning of this function.
  // We only save the model response here.
  await saveSessionMessage(companyId, sessionId, "model", response, platform, sessionId);

  // 6. Trigger Summarizer & QA Agents Asynchronously
  // We do not await these, we just let them run in the background.
  runSummarizerAgent(companyId, sessionId).catch(err => console.error("Summarizer failed:", err));
  runQAAnalysis(companyId, sessionId).catch(err => console.error("QA Agent failed:", err));

  return {
    routing,
    response
  };
}
