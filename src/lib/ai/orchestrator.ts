import { routeUserIntent } from './routerAgent';
import { handleCustomerServiceQuery } from './customerServiceAgent';
import { handleSalesQuery } from './salesAgent';
import { handleBookingQuery } from './bookingAgent';
import { getSessionHistory, saveSessionMessage, getCustomerProfile } from '../firebase/dbUtils';
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
    persona: string 
  }
) {
  console.log(`[Orchestrator] Processing message for company ${companyId}, session ${sessionId}`);

  // 1. Fetch Short-Term Memory (Today's History)
  const history = await getSessionHistory(companyId, sessionId);

  // 2. Fetch Long-Term Memory (CRM Facts)
  const crmProfile = await getCustomerProfile(companyId, sessionId);
  const crmFacts = crmProfile.extractedFacts || {};

  // 3. Route User Intent (Stateless, based on latest message)
  const routing = await routeUserIntent(message);
  console.log(`[Orchestrator] Detected Intent: ${routing.intent}`);
  
  let response = "";
  
  // 4. Call Specialized Agent with History and CRM Facts
  switch (routing.intent) {
    case "CUSTOMER_SERVICE":
      response = await handleCustomerServiceQuery(message, history, context.knowledgeBase, context.persona, crmFacts);
      break;
    case "SALES":
      response = await handleSalesQuery(message, history, context.productsCatalog, crmFacts);
      break;
    case "BOOKING":
      response = await handleBookingQuery(message, history, context.calendlyLink, crmFacts);
      break;
    case "ESCALATION":
      response = "Entiendo su frustración. Un agente humano se pondrá en contacto con usted en breve.";
      // TODO: Trigger notification to the Omnichannel Inbox Dashboard
      break;
    case "PAYMENT":
      response = "Por favor, envíe una captura de pantalla del comprobante de SINPE Móvil para verificar el pago.";
      break;
    default:
      response = await handleCustomerServiceQuery(message, history, context.knowledgeBase, context.persona, crmFacts);
      break;
  }
  
  // 5. Save Interaction to Short-Term Memory
  await saveSessionMessage(companyId, sessionId, "user", message);
  await saveSessionMessage(companyId, sessionId, "model", response);

  // 6. Trigger Summarizer & QA Agents Asynchronously
  // We do not await these, we just let them run in the background.
  runSummarizerAgent(companyId, sessionId).catch(err => console.error("Summarizer failed:", err));
  runQAAnalysis(companyId, sessionId).catch(err => console.error("QA Agent failed:", err));

  return {
    routing,
    response
  };
}
