import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const userId = await verifyIdToken(request);

    if (!userId || !adminDb) {
      return NextResponse.json({ error: "Unauthorized or Firebase not configured" }, { status: 401 });
    }

    // Get all companies for this user
    const companiesSnapshot = await adminDb.collection('companies').where('ownerId', '==', userId).get();
    
    if (companiesSnapshot.empty) {
       return NextResponse.json({ error: "No companies found" }, { status: 404 });
    }

    const batch = adminDb.batch();

    companiesSnapshot.forEach(doc => {
      const companyId = doc.id;

      // Session 1: AI Handling
      const session1Ref = adminDb.collection('sessions').doc(`${companyId}_+50688881111`);
      batch.set(session1Ref, {
        companyId: companyId,
        sessionId: "+50688881111",
        customerPhone: "+50688881111",
        platform: "whatsapp",
        status: "ai_handling",
        lastMessage: "Sí tenemos espacio, ¿a qué hora?",
        history: [
          { role: "user", parts: [{ text: "Hola, quería saber si tienen espacio para 4 personas" }], timestamp: Date.now() - 60000 },
          { role: "model", parts: [{ text: "¡Hola! Sí tenemos espacio, ¿a qué hora?" }], timestamp: Date.now() - 30000 }
        ],
        lastUpdated: new Date().toISOString(),
        updatedAt: Date.now() - 30000
      });

      // Session 2: Needs Human
      const session2Ref = adminDb.collection('sessions').doc(`${companyId}_+50699992222`);
      batch.set(session2Ref, {
        companyId: companyId,
        sessionId: "+50699992222",
        customerPhone: "+50699992222",
        platform: "web",
        status: "needs_human",
        lastMessage: "Quiero hablar con un humano YA",
        history: [
          { role: "user", parts: [{ text: "Mi producto llegó en mal estado" }], timestamp: Date.now() - 120000 },
          { role: "model", parts: [{ text: "Lo siento mucho, ¿puedes enviarme una foto?" }], timestamp: Date.now() - 90000 },
          { role: "user", parts: [{ text: "No, quiero un reembolso. Quiero hablar con un humano YA" }], timestamp: Date.now() - 60000 },
          { role: "model", parts: [{ text: "Entiendo su frustración. Un agente humano se pondrá en contacto con usted en breve." }], timestamp: Date.now() - 30000 }
        ],
        lastUpdated: new Date().toISOString(),
        updatedAt: Date.now() - 30000
      });
    });

    await batch.commit();

    return NextResponse.json({ success: true, seededCount: companiesSnapshot.size });

  } catch (error) {
    console.error("Chats Seeder error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
