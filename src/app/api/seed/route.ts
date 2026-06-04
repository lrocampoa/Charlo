import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const userId = await verifyIdToken(request);

    if (!userId || !adminDb) {
      return NextResponse.json({ error: "Unauthorized or Firebase not configured" }, { status: 401 });
    }

    const batch = adminDb.batch();
    
    // DEMO BUSINESS 1: PIZZERIA
    const pizzaId = `demo_pizza_${Date.now()}`;
    const pizzaRef = adminDb.collection('companies').doc(pizzaId);
    batch.set(pizzaRef, {
      name: "Luigi's Pizza",
      ownerId: userId,
      knowledgeBase: "Estamos abiertos de 11 AM a 10 PM. Entregas tardan 45 min. Aceptamos efectivo, tarjetas y SINPE.",
      productsCatalog: "- Pizza Pepperoni: 6000 CRC\n- Pizza Hawaiana: 6500 CRC\n- Palitos de ajo: 2000 CRC",
      persona: "Eres un chef italiano animado y amigable.",
      subscription: { tier: 'pro', currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000 },
      usage: { aiMessagesCurrentMonth: 0 },
      createdAt: new Date().toISOString()
    });

    const pizzaCustRef = adminDb.collection('customers').doc(`${pizzaId}_+50688881111`);
    batch.set(pizzaCustRef, {
      companyId: pizzaId,
      customerId: "+50688881111",
      extractedFacts: { nombre: "Carlos", preferencia: "Pizza sin piña" },
      createdAt: new Date().toISOString()
    });

    const pizzaOrderRef = adminDb.collection('orders').doc();
    batch.set(pizzaOrderRef, {
      companyId: pizzaId,
      customerId: "+50688881111",
      items: [{ name: "Pizza Pepperoni", price: 6000 }],
      total: 6000,
      status: "delivered",
      createdAt: new Date().toISOString()
    });

    // MOCKUP CHATS (SESSIONS) FOR INBOX
    const pizzaSession1Ref = adminDb.collection('sessions').doc(`${pizzaId}_+50688881111`);
    batch.set(pizzaSession1Ref, {
      companyId: pizzaId,
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

    const pizzaSession2Ref = adminDb.collection('sessions').doc(`${pizzaId}_+50699992222`);
    batch.set(pizzaSession2Ref, {
      companyId: pizzaId,
      sessionId: "+50699992222",
      customerPhone: "+50699992222",
      platform: "web",
      status: "needs_human",
      lastMessage: "Quiero hablar con un humano YA",
      history: [
        { role: "user", parts: [{ text: "Mi pizza llegó fría y aplastada" }], timestamp: Date.now() - 120000 },
        { role: "model", parts: [{ text: "Lo siento mucho, ¿puedes enviarme una foto?" }], timestamp: Date.now() - 90000 },
        { role: "user", parts: [{ text: "No, quiero un reembolso. Quiero hablar con un humano YA" }], timestamp: Date.now() - 60000 },
        { role: "model", parts: [{ text: "Entiendo su frustración. Un agente humano se pondrá en contacto con usted en breve." }], timestamp: Date.now() - 30000 }
      ],
      lastUpdated: new Date().toISOString(),
      updatedAt: Date.now() - 30000
    });

    // DEMO BUSINESS 2: CLINICA
    const clinicaId = `demo_clinica_${Date.now()}`;
    const clinicaRef = adminDb.collection('companies').doc(clinicaId);
    batch.set(clinicaRef, {
      name: "Clínica Dental Sonrisas",
      ownerId: userId,
      knowledgeBase: "Consultas de Lunes a Sábado de 8 AM a 6 PM. La limpieza cuesta $50. Calzas desde $40.",
      productsCatalog: "- Limpieza Dental: $50\n- Calza Blanca: $40\n- Blanqueamiento: $150",
      persona: "Eres una recepcionista médica muy profesional y empática.",
      subscription: { tier: 'growth', currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000 },
      usage: { aiMessagesCurrentMonth: 0 },
      createdAt: new Date().toISOString()
    });

    const clinicaCustRef = adminDb.collection('customers').doc(`${clinicaId}_+50688882222`);
    batch.set(clinicaCustRef, {
      companyId: clinicaId,
      customerId: "+50688882222",
      extractedFacts: { nombre: "María", historial: "Sensibilidad en las encías" },
      createdAt: new Date().toISOString()
    });

    const clinicaPaymentRef = adminDb.collection('payments').doc();
    batch.set(clinicaPaymentRef, {
      companyId: clinicaId,
      customerId: "+50688882222",
      amount: 50,
      reference: "SINPE-902348",
      method: "SINPE Móvil",
      status: "verified",
      createdAt: new Date().toISOString()
    });

    // Removed Boutique (Demo 3) as per requirements

    await batch.commit();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Seeder error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
