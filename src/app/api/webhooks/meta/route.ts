import * as crypto from "crypto";
import { NextResponse } from 'next/server';
import { processUserMessage } from '@/lib/ai/orchestrator';
import { getCompanyByWhatsAppId, getCompanyByFacebookPageId, getCompanyByInstagramId, trackWhatsAppUsage, saveSessionMessage, updateSessionStatus, checkAndSetPausedAutoResponder } from '@/lib/firebase/dbUtils';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { sendAdminAlert, sendOwnerEmailAlert } from '@/lib/notifications';

// Meta Verification Endpoint (GET)
// When you configure the webhook in Meta Developers, they send a GET request to verify ownership.

async function enforceLimitsAndPause(
  company: any,
  senderId: string,
  businessId: string, // WhatsApp phone ID or Page/IG ID
  platform: "whatsapp" | "messenger" | "instagram",
  messageText: string,
  accessToken: string
): Promise<boolean> {
  const tier = company.subscription?.tier || 'free';
  const status = company.subscription?.status || 'active';
  const usageCount = company.usage?.aiMessagesCurrentMonth || 0;
  
  let limit = Infinity;
  if (tier === 'starter') limit = 1000;
  if (tier === 'growth') limit = 5000;
  if (status === 'trialing') limit = 200; // Trial Limit (20% of Starter)

  const usageAlertsEnabled = company.notificationPreferences?.usageAlerts !== false;
  const humanEscalationsEnabled = company.notificationPreferences?.humanEscalations !== false;
  const cleanTest = (company.testPhoneNumber || '').replace(/\D/g, '');

  const sendMetaMessage = async (recipientId: string, text: string) => {
    if (!accessToken) return;
    const url = platform === 'whatsapp' 
      ? `https://graph.facebook.com/v19.0/${businessId}/messages`
      : `https://graph.facebook.com/v19.0/me/messages`;
    
    const body = platform === 'whatsapp'
      ? { messaging_product: "whatsapp", to: recipientId, text: { body: text } }
      : { recipient: { id: recipientId }, message: { text } };

    await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).catch(err => console.error(err));
  };

  const sendOwnerAlert = async (text: string) => {
    if (cleanTest && accessToken && adminDb) {
      // Try to get WHATSAPP phone ID if this is a messenger/IG webhook, otherwise use businessId
      const waId = company.whatsappPhoneNumberId || (platform === 'whatsapp' ? businessId : null);
      if (waId) {
        const waUrl = `https://graph.facebook.com/v19.0/${waId}/messages`;
        await fetch(waUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ messaging_product: "whatsapp", to: cleanTest, text: { body: text } })
        }).catch(err => console.error(err));
      }
    }
  };

  const dispatchOwnerEmail = async (subject: string, htmlBody: string) => {
    if (!company.ownerId || !adminAuth) return;
    try {
      const ownerRecord = await adminAuth.getUser(company.ownerId);
      if (ownerRecord.email) {
        await sendOwnerEmailAlert(ownerRecord.email, subject, htmlBody);
      }
    } catch (err) {
      console.error("Failed to fetch owner email for alert:", err);
    }
  };

  // 1. Sandbox mode check
  if (tier === 'free') {
    const cleanSender = senderId.replace(/\D/g, '');
    if (!cleanTest || cleanSender !== cleanTest) {
      console.log(`🚫 Sandbox mode active. Rejecting ${platform} message from ${senderId}`);
      await sendMetaMessage(senderId, "🤖 Este asistente virtual de Charlo está en modo Sandbox (Gratis). Si eres el dueño, ingresa a tu dashboard y mejora tu plan para atender a tus clientes reales.");
      return true; // Rejected
    }
  }

  // 2. Delinquent check
  if (tier !== 'free' && status !== 'active' && status !== 'trialing') {
    console.log(`🚫 Delinquent subscription. Rejecting message from ${senderId}`);
    const pausedMsg = "Este asistente está pausado temporalmente.";
    await saveSessionMessage(company.id, senderId, "user", messageText, platform, senderId);
    await updateSessionStatus(company.id, senderId, "needs_human");
    await saveSessionMessage(company.id, senderId, "model", pausedMsg, platform, senderId);
    await sendMetaMessage(senderId, pausedMsg);

    if (humanEscalationsEnabled && adminDb) {
       await sendOwnerAlert(`🙋‍♂️ *Un cliente necesita asistencia humana:* El asistente automático está pausado por falta de pago. Atiende la conversación en tu Inbox de Charlo.`);
       dispatchOwnerEmail(
         "⚠️ Asistente Pausado por Falta de Pago", 
         `<p>Un cliente (<strong>${senderId}</strong>) necesita ayuda, pero tu asistente está pausado por un problema con tu suscripción.</p><p>Por favor ingresa a tu dashboard de Charlo para regularizar el pago.</p>`
       );
    }
    return true; // Rejected
  }

  // 3. Hard Limits check
  if (usageCount >= limit) {
    console.log(`🚫 Hard limit reached. Rejecting message from ${senderId}`);
    const pausedMsg = "Este asistente está pausado temporalmente por haber alcanzado su límite de uso.";
    await saveSessionMessage(company.id, senderId, "user", messageText, platform, senderId);
    await updateSessionStatus(company.id, senderId, "needs_human");
    await saveSessionMessage(company.id, senderId, "model", pausedMsg, platform, senderId);
    await sendMetaMessage(senderId, pausedMsg);

    if (usageAlertsEnabled && !company.usage?.hundredPercentWarningSent && adminDb) {
       await sendOwnerAlert(`🚨 *Alerta Crítica:* Tu asistente de IA ha alcanzado su límite (${limit} mensajes) y ha sido pausado. Mejora tu plan en el dashboard para reanudar el servicio o seguir atendiendo clientes manualmente.`);
       await adminDb.collection('companies').doc(company.id).update({ 'usage.hundredPercentWarningSent': true });
       dispatchOwnerEmail(
         "🚨 Límite de Uso Alcanzado (Asistente Pausado)",
         `<p>Tu asistente de IA ha alcanzado su límite de <strong>${limit} mensajes</strong> y ha sido pausado.</p><p>Para seguir atendiendo a tus clientes automáticamente, por favor mejora tu plan en el dashboard.</p>`
       );
    }

    if (humanEscalationsEnabled && adminDb) {
       await sendOwnerAlert(`🙋‍♂️ *Un cliente necesita asistencia humana:* El asistente automático está pausado por límite de uso. Atiende la conversación en tu Inbox de Charlo.`);
    }
    return true; // Rejected
  }

  // 4. Usage Warning Alerts (soft check)
  if (limit !== Infinity && usageAlertsEnabled && adminDb) {
     let thresholdHit = 0;
     let flagField = '';
     if (usageCount >= limit * 0.95 && !company.usage?.ninetyFivePercentWarningSent) {
       thresholdHit = 95; flagField = 'usage.ninetyFivePercentWarningSent';
     } else if (usageCount >= limit * 0.90 && !company.usage?.ninetyPercentWarningSent) {
       thresholdHit = 90; flagField = 'usage.ninetyPercentWarningSent';
     } else if (usageCount >= limit * 0.85 && !company.usage?.eightyFivePercentWarningSent) {
       thresholdHit = 85; flagField = 'usage.eightyFivePercentWarningSent';
     }
     if (thresholdHit > 0) {
       await sendOwnerAlert(`⚠️ *Aviso de Charlo:* Tu plan de IA ha consumido el ${thresholdHit}% de los mensajes disponibles de este ciclo (${usageCount}/${limit}). Por favor mejora tu plan en el dashboard para evitar interrupciones.`);
       await adminDb.collection('companies').doc(company.id).update({ [flagField]: true });
     }
  }

  return false; // Not rejected, proceed
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!VERIFY_TOKEN) {
    console.error("WHATSAPP_VERIFY_TOKEN is not configured.");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

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
    const rawBody = await request.text();

    // Verify Webhook Signature
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (appSecret) {
      const signatureHeader = request.headers.get("x-hub-signature-256");

      if (!signatureHeader) {
        console.warn("⚠️ Missing x-hub-signature-256 header. Rejecting request.");
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }

      const expectedSignature = crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex");

      const expectedSignatureWithPrefix = `sha256=${expectedSignature}`;

      try {
        const sigBuf = Buffer.from(signatureHeader);
        const expectedBuf = Buffer.from(expectedSignatureWithPrefix);

        if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
          console.warn("⚠️ Invalid webhook signature. Rejecting request.");
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
      } catch (e) {
        console.warn("⚠️ Error verifying signature. Rejecting request.", e);
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);

    // Check if this is a WhatsApp API event
    if (body.object === "whatsapp_business_account") {
      // Cache for businessPhoneId to avoid redundant DB calls in the loop
      const companyCache: Record<string, any> = {};

      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages) {
            let profileName = "";
            if (change.value.contacts && change.value.contacts.length > 0) {
              profileName = change.value.contacts[0].profile?.name || "";
            }

            const message = change.value.messages[0];
            const senderPhone = message.from;
            const businessPhoneId = change.value.metadata.phone_number_id;
            let messageText = message.text?.body || "";
            
            // Look up company by businessPhoneId in Firebase (memoized)
            let company: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = companyCache[businessPhoneId];
            if (company === undefined) {
              company = await getCompanyByWhatsAppId(businessPhoneId);
              companyCache[businessPhoneId] = company || null;
            }
            
            if (!company) {
              console.warn(`⚠️ No company found for WhatsApp Phone ID: ${businessPhoneId}`);
              return NextResponse.json({ status: "ignored", reason: "unknown_phone_id" }, { status: 200 });
            }

            const accessToken = company.metaAccessToken || process.env.WHATSAPP_TOKEN;

            // --- PAUSED BUSINESS LOGIC ---
            if (company.isPaused) {
              const shouldSend = await checkAndSetPausedAutoResponder(company.id, senderPhone);
              if (shouldSend) {
                // Send auto-responder
                await fetch(`https://graph.facebook.com/v19.0/${businessPhoneId}/messages`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: senderPhone,
                    type: "text",
                    text: { body: "Hola! Gracias por escribirnos. El asistente está inactivo temporalmente. En un momento te contactaremos." }
                  })
                }).catch(err => console.error("Error sending pause responder WA:", err));
              }
              // Return early to skip AI processing
              return NextResponse.json({ status: "ignored", reason: "business_paused" }, { status: 200 });
            }

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

            // Track Usage Incrementally
            await trackWhatsAppUsage(company.id);

            const isRejected = await enforceLimitsAndPause(company, senderPhone, businessPhoneId, "whatsapp", messageText, accessToken);
            if (isRejected) continue;

            const context = {
              knowledgeBase: company.knowledgeBase || "",
              productsCatalog: company.productsCatalog || "",
              calendlyLink: company.calendlyLink || "",
              persona: company.persona || "Eres un asistente virtual amable y profesional.",
              customerName: profileName
            };

            // Call Gemini Orchestrator
            const { response, routing } = await processUserMessage(
              company.id, 
              senderPhone, // use their phone number as the session ID
              messageText, 
              context,
              imagePart,
              "whatsapp"
            );

            // Send escalation notification if the intent is ESCALATION
            const humanEscalationsEnabled = company.notificationPreferences?.humanEscalations !== false;
            const cleanTest = (company.testPhoneNumber || '').replace(/\D/g, '');

            const sendOwnerAlert = async (text: string) => {
               if (cleanTest && accessToken && adminDb) {
                 await fetch(`https://graph.facebook.com/v19.0/${businessPhoneId}/messages`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ messaging_product: "whatsapp", to: cleanTest, text: { body: text } })
                 }).catch(err => console.error(err));
               }
            };

            const dispatchOwnerEmail = async (subject: string, htmlBody: string) => {
               if (!company.ownerId || !adminAuth) return;
               try {
                 const ownerRecord = await adminAuth.getUser(company.ownerId);
                 if (ownerRecord.email) {
                   await sendOwnerEmailAlert(ownerRecord.email, subject, htmlBody);
                 }
               } catch (err) {
                 console.error("Failed to fetch owner email for alert:", err);
               }
            };

            if (routing?.intent === "ESCALATION" && humanEscalationsEnabled && adminDb) {
              await sendOwnerAlert(`🙋‍♂️ *Un cliente necesita asistencia humana:* El cliente ${senderPhone} ha sido escalado. Atiende la conversación en tu Inbox de Charlo.`);
              dispatchOwnerEmail(
                "🙋‍♂️ Un cliente necesita asistencia humana",
                `<p>El asistente de IA no pudo resolver la solicitud del cliente (<strong>${senderPhone}</strong>) y la conversación ha sido escalada.</p><p>Por favor ingresa a tu <a href="https://app.charlo.com/dashboard/inbox">Inbox de Charlo</a> para responderle personalmente.</p>`
              );
            }

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

    // Check if this is a Messenger (Page) or Instagram event
    if (body.object === "page" || body.object === "instagram") {
      const isInstagram = body.object === "instagram";
      const platform = isInstagram ? "instagram" : "messenger";
      
      // Cache for recipientId to avoid redundant DB calls in the loop
      const companyCache: Record<string, any> = {};

      for (const entry of body.entry) {
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            if (messagingEvent.message) {
              const senderId = messagingEvent.sender.id;
              const recipientId = messagingEvent.recipient.id; // Page ID or IG Account ID
              const messageText = messagingEvent.message.text || "";
              
              if (!messageText && !messagingEvent.message.attachments) continue;
              
              let company: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = companyCache[recipientId];
              if (company === undefined) {
                if (isInstagram) {
                  company = await getCompanyByInstagramId(recipientId);
                } else {
                  company = await getCompanyByFacebookPageId(recipientId);
                }
                companyCache[recipientId] = company || null;
              }

              if (!company) {
                console.warn(`⚠️ No company found for ${platform} ID: ${recipientId}`);
                continue;
              }

              const accessToken = company.metaAccessToken || process.env.WHATSAPP_TOKEN;

              // --- PAUSED BUSINESS LOGIC ---
              if (company.isPaused) {
                const shouldSend = await checkAndSetPausedAutoResponder(company.id, senderId);
                if (shouldSend && accessToken) {
                  // Send auto-responder
                  await fetch(`https://graph.facebook.com/v19.0/me/messages`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      recipient: { id: senderId },
                      message: { text: "Hola! Gracias por escribirnos. El asistente está inactivo temporalmente. En un momento te contactaremos." }
                    })
                  }).catch(err => console.error(`Error sending pause responder ${platform}:`, err));
                }
                // Continue to skip AI processing for this message
                continue;
              }

              console.log(`\n============================`);
              console.log(`💬 NEW ${platform.toUpperCase()} MESSAGE`);
              console.log(`From: ${senderId}`);
              console.log(`To ID: ${recipientId}`);
              console.log(`Message: ${messageText}`);
              console.log(`============================\n`);

              const isRejected = await enforceLimitsAndPause(company, senderId, recipientId, platform as "messenger" | "instagram", messageText, accessToken);
              if (isRejected) continue;

              const context = {
                knowledgeBase: company.knowledgeBase || "",
                productsCatalog: company.productsCatalog || "",
                calendlyLink: company.calendlyLink || "",
                persona: company.persona || "Eres un asistente virtual amable y profesional."
              };

              const { response } = await processUserMessage(
                company.id, 
                senderId, 
                messageText || "[Archivo/Attachment Recibido]", 
                context,
                null, 
                platform as any // eslint-disable-line @typescript-eslint/no-explicit-any
              );

              if (!response) {
                 console.log("🔇 No response from AI. Skipping Meta API call.");
                 continue;
              }

              console.log(`🤖 AI Response generated: ${response}`);

              if (accessToken) {
                try {
                  await fetch(`https://graph.facebook.com/v19.0/me/messages`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      recipient: { id: senderId },
                      message: { text: response }
                    })
                  });
                  console.log(`✅ Message sent back to ${senderId} via ${platform}`);
                } catch (err) {
                  console.error(`❌ Failed to send ${platform} message:`, err);
                }
              } else {
                console.warn(`⚠️ No Meta Access Token found to send ${platform} reply.`);
              }
            }
          }
        }
      }
      return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
    }
    
    return NextResponse.json({ error: "Unsupported event" }, { status: 404 });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("Meta Webhook Error:", error);
    await sendAdminAlert("WhatsApp Webhook Critical Error", error?.message || String(error));
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
