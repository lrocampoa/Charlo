import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';
import { saveSessionMessage, updateSessionStatus } from '@/lib/firebase/dbUtils';
import { getCompanyConfig } from '@/lib/firebase/dbUtils';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;
    const body = await request.json();
    const { sessionId, text, platform = "whatsapp", customerPhone } = body;

    if (!sessionId || !text) {
      return NextResponse.json({ error: 'Missing sessionId or text' }, { status: 400 });
    }

    // 1. Get Company details for Meta Token
    const company = await getCompanyConfig(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 2. Save Human Message to Firestore
    const messageDocId = await saveSessionMessage(companyId, sessionId, "human", text, platform, customerPhone || sessionId);
    
    // 3. Ensure the session status is human_handling
    await updateSessionStatus(companyId, sessionId, "human_handling");

    // 4. Send via Meta API if platform is whatsapp
    if (platform === "whatsapp") {
      const accessToken = company.metaAccessToken || process.env.WHATSAPP_TOKEN;
      const businessPhoneId = company.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (accessToken && businessPhoneId) {
        try {
          const res = await fetch(`https://graph.facebook.com/v19.0/${businessPhoneId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: customerPhone || sessionId,
              text: { body: text }
            })
          });
          
          const fetchData = await res.json();
          if (res.ok && fetchData.messages && fetchData.messages.length > 0) {
             const wamid = fetchData.messages[0].id;
             if (adminDb) {
               await adminDb.collection('sessions').doc(`${companyId}_${sessionId}`).collection('messages').doc(messageDocId).update({ id: wamid, wamid: wamid });
             }
          } else {
             console.error("Meta API Error:", fetchData);
             if (adminDb) {
               await adminDb.collection('sessions').doc(`${companyId}_${sessionId}`).collection('messages').doc(messageDocId).update({ status: 'failed' });
             }
          }
        } catch (e) {
          console.error("Failed to send Meta message", e);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Messages API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
