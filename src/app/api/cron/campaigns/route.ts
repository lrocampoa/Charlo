import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  // In a real app, verify a Cron Secret to ensure only Vercel/Scheduler can call this
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = adminDb;
    if (!db) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

    const companiesSnapshot = await db.collection('companies').get();
    let totalMessagesSent = 0;

    for (const companyDoc of companiesSnapshot.docs) {
      const companyId = companyDoc.id;
      const companyData = companyDoc.data();

      // Skip if WhatsApp is not configured
      if (!companyData.whatsappPhoneNumberId || !companyData.metaAccessToken) continue;

      // Fetch active triggers
      const triggersSnapshot = await db.collection('companies').doc(companyId).collection('triggers').where('isActive', '==', true).get();
      if (triggersSnapshot.empty) continue;

      for (const triggerDoc of triggersSnapshot.docs) {
        const trigger = triggerDoc.data();
        console.log(`[CRON] Evaluating Trigger '${trigger.name}' for Company ${companyId}`);

        // Mock Evaluation Logic (In production, this queries 'orders', 'reservations', etc.)
        let matchedUsers: string[] = [];

        if (trigger.condition === 'pending_cart_2h') {
          // Query pending orders older than 2h
          const ordersSnapshot = await db.collection('orders')
            .where('companyId', '==', companyId)
            .where('status', '==', 'pending')
            .get();
          
          ordersSnapshot.forEach(doc => {
            const data = doc.data();
            // Mock time check
            matchedUsers.push(data.customerPhone || data.customerId);
          });
        } 
        else if (trigger.condition === 'reservation_upcoming_24h') {
          const resSnapshot = await db.collection('companies').doc(companyId).collection('reservations').get();
          resSnapshot.forEach(doc => {
            matchedUsers.push(doc.data().customerPhone || doc.data().customerId);
          });
        }
        else {
          // Mock generic match for demo purposes
          matchedUsers.push('50688888888');
        }

        // Deduplicate
        matchedUsers = [...new Set(matchedUsers)].filter(Boolean);

        // "Send" the campaign
        for (const phone of matchedUsers) {
          console.log(`[CRON] Firing Proactive Campaign '${trigger.templateName}' to ${phone}`);
          // Simulated WhatsApp API call
          /*
          await fetch(`https://graph.facebook.com/v19.0/${companyData.whatsappPhoneNumberId}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${companyData.metaAccessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: phone,
              type: "template",
              template: { name: trigger.templateName, language: { code: "es_MX" } }
            })
          });
          */
          totalMessagesSent++;
        }
      }
    }

    return NextResponse.json({ success: true, executed: true, totalMessagesSent });
  } catch (error) {
    console.error("Cron Campaigns Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
