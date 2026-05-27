import { NextResponse } from 'next/server';
import { processUserMessage } from '@/lib/ai/orchestrator';
import { getCompanyByWhatsAppId } from '@/lib/firebase/dbUtils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'charlo_secure_token_123';

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return new NextResponse('Bad Request', { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages && change.value.messages[0]) {
            const msg = change.value.messages[0];
            const from = msg.from; // Sender's phone number = sessionId
            const type = msg.type;
            const phoneId = change.value.metadata.phone_number_id;
            
            // 1. Identify Tenant
            let companyConfig = await getCompanyByWhatsAppId(phoneId);
            if (!companyConfig) {
               console.warn(`No company found for WhatsApp Phone ID: ${phoneId}`);
               // Fallback for demo purposes
               companyConfig = {
                  id: "DEMO_COMPANY",
                  knowledgeBase: "Our business hours are 9 AM to 5 PM, Mon-Fri.",
                  productsCatalog: "- Cappuccino: 2000 CRC\n- Latte: 2500 CRC",
                  calendlyLink: "https://calendly.com/mock-business",
                  persona: "Pura vida and very friendly."
               } as any;
            }
            
            let userText = "";
            if (type === 'text') {
              userText = msg.text.body;
            } else if (type === 'image') {
              userText = "[User sent an image. Vision agent processing required.]";
            } else if (type === 'audio') {
              userText = "[User sent an audio note. Speech-to-text processing required.]";
            }

            if (userText) {
              console.log(`WhatsApp Message from ${from} routed to company ${companyConfig.id}`);
              
              const aiResult = await processUserMessage(companyConfig.id, from, userText, companyConfig as any);
              if (aiResult.response) {
                await sendWhatsAppMessage(from, aiResult.response, process.env.WHATSAPP_TOKEN, phoneId);
              }
            }
          }
        }
      }
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    } else {
      return new NextResponse('Not Found', { status: 404 });
    }
  } catch (error) {
    console.error("Webhook Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function sendWhatsAppMessage(to: string, text: string, token?: string, phoneNumberId?: string) {
  if (!token || !phoneNumberId) {
    console.warn("WhatsApp credentials missing. Skipping sending message back.");
    return;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!response.ok) {
      console.error("Failed to send WhatsApp message:", await response.json());
    }
  } catch (err) {
    console.error("HTTP Error sending WhatsApp message:", err);
  }
}
