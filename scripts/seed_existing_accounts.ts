import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { adminDb } from '../src/lib/firebase/admin';

async function seedExistingAccounts() {
  console.log("Seeding existing accounts with dummy data...");

  if (!adminDb) {
    console.error("No database initialized");
    return;
  }

  const db = adminDb;

  const companiesSnapshot = await db.collection('companies').get();

  if (companiesSnapshot.empty) {
    console.log("No companies found!");
    return;
  }

  const batch = db.batch();

  companiesSnapshot.forEach(doc => {
    const companyId = doc.id;
    const companyData = doc.data();
    console.log(`Seeding data for company: ${companyData.name} (${companyId})`);

    // Update loyaltyConfig if missing
    if (!companyData.loyaltyConfig) {
      batch.update(db.collection('companies').doc(companyId), {
        loyaltyConfig: {
          pointsEnabled: true,
          pointsRatio: 100,
          cashbackEnabled: true,
          cashbackPercentage: 5
        }
      });
    }

    const customerPhone = "+50688889999";

    // 1. Clientes
    const custRef = db.collection('customers').doc(`${companyId}_${customerPhone}`);
    batch.set(custRef, {
      companyId: companyId,
      customerId: customerPhone,
      extractedFacts: { nombre: "Cliente Demo", nota: "Creado por seeder" },
      createdAt: new Date().toISOString()
    });

    // 2. Órdenes (Subcollection)
    const orderRef = db.collection('companies').doc(companyId).collection('orders').doc();
    batch.set(orderRef, {
      companyId: companyId,
      customerId: customerPhone,
      items: [{ name: "Producto/Servicio Demo", price: 5000 }],
      total: 5000,
      status: "delivered",
      createdAt: new Date().toISOString()
    });

    // 3. Pagos (Subcollection)
    const paymentRef = db.collection('companies').doc(companyId).collection('payments').doc();
    batch.set(paymentRef, {
      companyId: companyId,
      customerId: customerPhone,
      amount: 5000,
      reference: "SINPE-999999",
      method: "SINPE Móvil",
      status: "verified",
      createdAt: new Date().toISOString()
    });

    // 4. Conversaciones (Sessions)
    const sessionRef = db.collection('sessions').doc(`${companyId}_${customerPhone}`);
    batch.set(sessionRef, {
      companyId: companyId,
      sessionId: customerPhone,
      customerPhone: customerPhone,
      platform: "whatsapp",
      status: "ai_handling",
      lastMessage: "Gracias por la información.",
      history: [
        { role: "user", parts: [{ text: "Hola, ¿cómo funciona el servicio?" }], timestamp: Date.now() - 60000 },
        { role: "model", parts: [{ text: "¡Hola! Soy el asistente virtual. ¿En qué te puedo ayudar?" }], timestamp: Date.now() - 30000 }
      ],
      lastUpdated: new Date().toISOString(),
      updatedAt: Date.now() - 30000
    });

    // 5. Reservaciones
    const resRef = db.collection('companies').doc(companyId).collection('reservations').doc();
    batch.set(resRef, {
      customerId: customerPhone,
      customerName: "Cliente Demo",
      date: new Date(Date.now() + 86400000).toISOString(),
      details: "Reserva de prueba",
      status: "confirmed",
      createdAt: new Date().toISOString()
    });

    // 6. Servicios
    const servRef = db.collection('companies').doc(companyId).collection('services').doc();
    batch.set(servRef, {
      name: "Servicio Demo",
      description: "Este es un servicio autogenerado",
      price: 2500,
      durationMinutes: 45,
      capacity: 5,
      isActive: true,
      createdAt: new Date().toISOString()
    });

    // 7. Productos
    const prodRef = db.collection('companies').doc(companyId).collection('products').doc();
    batch.set(prodRef, {
      name: "Producto Demo",
      description: "Este es un producto autogenerado",
      price: 2500,
      currency: "CRC",
      source: "ai",
      createdAt: new Date().toISOString()
    });

    // 8. Campañas
    const campRef = db.collection('companies').doc(companyId).collection('campaigns').doc();
    batch.set(campRef, {
      name: "Campaña Demo",
      description: "Promoción generada por el sistema",
      targetAudience: "Todos los clientes",
      status: "active",
      createdAt: new Date().toISOString()
    });
  });

  await batch.commit();
  console.log("Existing accounts seeded successfully!");
}

seedExistingAccounts().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
