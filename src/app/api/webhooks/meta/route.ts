import { NextResponse } from 'next/server';
import { processUserMessage } from '@/lib/ai/orchestrator';
import { getCompanyByWhatsAppId } from '@/lib/firebase/dbUtils';
import { sendAdminAlert } from '@/lib/notifications';

// Meta Verification Endpoint (GET)
// When you configure the webhook in Meta Developers, they send a GET request to verify ownership.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "charlo_secret_token_2026";

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Meta Webhook Verified!");
      return new NextResponse(challenge, { status: 200 });
    } else {
      return NextResponse.json({ error: "Verification failed" }, { status: 403 });
    }
  }

  return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
}

// Meta Message Receiver (POST)
// This is where all incoming WhatsApp messages will arrive.
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if this is a WhatsApp API event
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages) {
            const message = change.value.messages[0];
            const senderPhone = message.from;
            const businessPhoneId = change.value.metadata.phone_number_id;
            let messageText = message.text?.body || "";
            
            // Look up company by businessPhoneId in Firebase
            const company = await getCompanyByWhatsAppId(businessPhoneId);
            
            if (!company) {
              console.warn(`⚠️ No company found for WhatsApp Phone ID: ${businessPhoneId}`);
              return NextResponse.json({ status: "ignored", reason: "unknown_phone_id" }, { status: 200 });
            }

            const accessToken = company.metaAccessToken || process.env.META_ACCESS_TOKEN;

            // --- IMAGE PROCESSING ---
            let imagePart = null;
            if (message.type === 'image' && message.image?.id) {
              console.log(`📸 Image detected: ${message.image.id}`);
              messageText = "[Imagen Recibida]";
              if (accessToken) {
                try {
                  // 1. Get Media URL
                  const mediaUrlRes = await fetch(`https://graph.facebook.com/v19.0/${message.image.id}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                  });
                  const mediaData = await mediaUrlRes.json();
                  
                  if (mediaData.url) {
                    // 2. Download Binary Data
                    const imgRes = await fetch(mediaData.url, {
                      headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    const arrayBuffer = await imgRes.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const base64Data = buffer.toString('base64');
                    
                    imagePart = {
                      data: base64Data,
                      mimeType: message.image.mime_type || "image/jpeg"
                    };
                    console.log("✅ Image successfully downloaded and converted to Base64");
                  }
                } catch (err) {
                  console.error("❌ Failed to download image from Meta:", err);
                }
              } else {
                console.warn("⚠️ Cannot download image without Meta Access Token.");
              }
            }

            console.log(`\n============================`);
            console.log(`💬 NEW WHATSAPP MESSAGE`);
            console.log(`From: ${senderPhone}`);
            console.log(`To Phone ID: ${businessPhoneId}`);
            console.log(`Message: ${messageText}`);
            console.log(`============================\n`);

            const context = {
              knowledgeBase: company.knowledgeBase || "",
              productsCatalog: company.productsCatalog || "",
              calendlyLink: company.calendlyLink || "",
              persona: company.persona || "Eres un asistente virtual amable y profesional."
            };

            // Call Gemini Orchestrator
            const { response } = await processUserMessage(
              company.id, 
              senderPhone, // use their phone number as the session ID
              messageText, 
              context,
              imagePart,
              "whatsapp"
            );

            if (!response) {
               console.log("🔇 No response from AI (likely human_handling mode). Skipping Meta API call.");
               continue; // Move to next change
            }

            console.log(`🤖 AI Response generated: ${response}`);

            // Send response back via Meta Graph API
            if (accessToken) {
              await fetch(`https://graph.facebook.com/v19.0/${businessPhoneId}/messages`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  messaging_product: "whatsapp",
                  to: senderPhone,
                  text: { body: response }
                })
              });
              console.log(`✅ Message sent back to ${senderPhone}`);
            } else {
              console.warn("⚠️ No Meta Access Token found for company or environment. Cannot send reply.");
            }
          }
        }
      }
      return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
    }
    
    return NextResponse.json({ error: "Unsupported event" }, { status: 404 });
  } catch (error: any) {
    console.error("Meta Webhook Error:", error);
    await sendAdminAlert("WhatsApp Webhook Critical Error", error?.message || String(error));
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
