import { adminDb } from './src/lib/firebase/admin';

async function seed() {
  const companyId = 'mockup_restaurant_001';
  
  const companyData = {
    name: "La Trattoria del Sol 🍝",
    ownerId: "system_mockup",
    metaAccessToken: process.env.WHATSAPP_TOKEN || "",
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    persona: "Eres un mesero amable, experto en comida italiana y muy atento. Trabajas en 'La Trattoria del Sol'.",
    knowledgeBase: `Bienvenido a La Trattoria del Sol!
    
Horarios: Lunes a Domingo de 12:00 PM a 10:00 PM.
Ubicación: San José, Costa Rica.
Opciones de pago: Efectivo, Tarjeta y SINPE Móvil.

Menú Principal:
1. Pizza Margarita - ¢6,000
2. Pasta Carbonara - ¢7,500
3. Lasaña de Carne - ¢8,000
4. Tiramisú (Postre) - ¢3,500
5. Bebidas Naturales - ¢1,500

Reglas: 
Si el cliente pregunta por el menú, muéstralo de forma atractiva.
Si el cliente quiere hacer un pedido, confirma los platos, pregúntale su dirección de entrega y su método de pago preferido.`,
    createdAt: new Date().toISOString(),
    status: 'active'
  };

  try {
    await adminDb.collection('companies').doc(companyId).set(companyData);
    console.log("✅ Mockup Restaurant created successfully in Firestore!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating mockup:", error);
    process.exit(1);
  }
}

seed();
