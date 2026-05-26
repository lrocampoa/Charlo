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
    await saveSessionMessage(companyId, sessionId, "human", text, platform, customerPhone || sessionId);
    
    // 3. Ensure the session status is human_handling
    await updateSessionStatus(companyId, sessionId, "human_handling");

    // 4. Send via Meta API if platform is whatsapp
    if (platform === "whatsapp") {
      const accessToken = company.metaAccessToken || process.env.META_ACCESS_TOKEN;
      const businessPhoneId = company.whatsappPhoneNumberId || process.env.META_PHONE_ID;

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
          
          if (!res.ok) {
             console.error("Meta API Error:", await res.text());
             // We still return success because it was saved to DB, but might want to warn
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
