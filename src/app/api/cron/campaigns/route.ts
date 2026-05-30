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

    // 1. Gather configured companies
    const validCompanies = new Map();
    for (const doc of companiesSnapshot.docs) {
      const data = doc.data();
      if (data.whatsappPhoneNumberId && data.metaAccessToken) {
        validCompanies.set(doc.id, data);
      }
    }

    if (validCompanies.size === 0) {
      return NextResponse.json({ success: true, executed: true, totalMessagesSent: 0 });
    }

    // 2. Fetch all active triggers across all valid companies in one query
    const triggersSnapshot = await db.collectionGroup('triggers').where('isActive', '==', true).get();

    const triggersByCompany = new Map();
    const companiesNeedingOrders = new Set<string>();
    const companiesNeedingReservations = new Set<string>();

    triggersSnapshot.forEach(doc => {
      const companyId = doc.ref.parent.parent?.id;
      if (!companyId || !validCompanies.has(companyId)) return;

      const trigger = doc.data();

      if (!triggersByCompany.has(companyId)) triggersByCompany.set(companyId, []);
      triggersByCompany.get(companyId).push(trigger);

      if (trigger.condition === 'pending_cart_2h') {
        companiesNeedingOrders.add(companyId);
      } else if (trigger.condition === 'reservation_upcoming_24h') {
        companiesNeedingReservations.add(companyId);
      }
    });

    // 3. Concurrently fetch only the necessary data per company to avoid OOM
    const ordersByCompany = new Map();
    const reservationsByCompany = new Map();

    await Promise.all([
      // Fetch Orders
      ...Array.from(companiesNeedingOrders).map(async (companyId) => {
        const ordersSnapshot = await db.collection('orders')
          .where('companyId', '==', companyId)
          .where('status', '==', 'pending')
          .get();
        ordersByCompany.set(companyId, ordersSnapshot.docs.map(d => d.data()));
      }),
      // Fetch Reservations
      ...Array.from(companiesNeedingReservations).map(async (companyId) => {
        const resSnapshot = await db.collection('companies').doc(companyId).collection('reservations').get();
        reservationsByCompany.set(companyId, resSnapshot.docs.map(d => d.data()));
      })
    ]);

    let totalMessagesSent = 0;

    // 4. Evaluate triggers locally
    for (const [companyId, triggers] of triggersByCompany.entries()) {
      const companyData = validCompanies.get(companyId);
      for (const trigger of triggers as any[]) {
        console.log(`[CRON] Evaluating Trigger '${trigger.name}' for Company ${companyId}`);

        let matchedUsers: string[] = [];

        if (trigger.condition === 'pending_cart_2h') {
          const companyOrders = ordersByCompany.get(companyId) || [];
          for (const o of companyOrders) {
            matchedUsers.push(o.customerPhone || o.customerId);
          }
        } 
        else if (trigger.condition === 'reservation_upcoming_24h') {
          const companyRes = reservationsByCompany.get(companyId) || [];
          for (const r of companyRes) {
            matchedUsers.push(r.customerPhone || r.customerId);
          }
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
