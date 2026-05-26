import { NextResponse } from 'next/server';

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
            const messageText = message.text?.body || "[No text / Media]";

            console.log(`\n============================`);
            console.log(`💬 NEW WHATSAPP MESSAGE`);
            console.log(`From: ${senderPhone}`);
            console.log(`To Phone ID: ${businessPhoneId}`);
            console.log(`Message: ${messageText}`);
            console.log(`============================\n`);

            // TODO: Look up company by businessPhoneId in Firebase
            // TODO: Send message history + new message to Gemini
            // TODO: Send Gemini response back via Meta Graph API using the company's metaAccessToken
          }
        }
      }
      return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
    }
    
    return NextResponse.json({ error: "Unsupported event" }, { status: 404 });
  } catch (error) {
    console.error("Meta Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
