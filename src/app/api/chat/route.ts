import { NextResponse } from 'next/server';
import { processUserMessage } from '@/lib/ai/orchestrator';
import { getCompanyConfig } from '@/lib/firebase/dbUtils';


// Simple in-memory rate limiter
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitMap.entries()) {
    const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (validTimestamps.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, validTimestamps);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitMap, 5 * 60 * 1000);

export async function POST(request: Request) {
  try {
    const { message, companyId, sessionId } = await request.json();

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const identifier = ip !== 'unknown' ? ip : sessionId;

    if (identifier) {
      const now = Date.now();
      const userRequests = rateLimitMap.get(identifier) || [];
      const validRequests = userRequests.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

      if (validRequests.length >= MAX_REQUESTS_PER_WINDOW) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }

      validRequests.push(now);
      rateLimitMap.set(identifier, validRequests);
    }


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
