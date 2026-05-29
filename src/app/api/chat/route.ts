import { NextResponse } from 'next/server';
import { processUserMessage } from '@/lib/ai/orchestrator';
import { getCompanyConfig } from '@/lib/firebase/dbUtils';

export async function POST(request: Request) {
  try {
    const { message, companyId, sessionId } = await request.json();

    if (!message || !companyId || !sessionId) {
      return NextResponse.json({ error: "Message, companyId, and sessionId are required" }, { status: 400 });
    }

    // Fetch this context from Firebase based on the embedded companyId
    let companyConfig: any = await getCompanyConfig(companyId);

    if (!companyConfig) {
      // Fallback for demo purposes if company not found
      companyConfig = {
        knowledgeBase: "Our business hours are 9 AM to 5 PM, Mon-Fri. We offer organic coffee and pastries.",
        productsCatalog: "- Cappuccino: 2000 CRC\n- Latte: 2500 CRC\n- Croissant: 1500 CRC",
        calendlyLink: "https://calendly.com/mock-business",
        persona: "Pura vida and very friendly, use Costa Rican slang.",
        servicesList: []
      };
    }

    // Call orchestrator with full multi-tenant and memory support
    const aiResult = await processUserMessage(companyId, sessionId, message, companyConfig as any);

    return NextResponse.json({ 
      reply: aiResult.response,
      intent: aiResult.routing.intent 
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}
