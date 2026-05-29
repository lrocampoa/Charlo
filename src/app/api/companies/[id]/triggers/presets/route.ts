import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';

const PRESETS: Record<string, any[]> = {
  retail: [
    {
      name: "Recuperación de Carrito Abandonado",
      description: "Envía un mensaje a clientes que agregaron productos pero no compraron tras 2 horas.",
      condition: "pending_cart_2h",
      templateName: "abandoned_cart_reminder",
      systemPrompt: "Eres un asistente amable de tienda. Saluda al cliente, recuérdale que dejó artículos en su carrito y ofrécele ayuda para terminar la compra.",
      isActive: false
    },
    {
      name: "Seguimiento Post-Compra (Review)",
      description: "Pide una reseña 3 días después de una compra exitosa.",
      condition: "order_completed_3d",
      templateName: "post_purchase_review",
      systemPrompt: "Pregúntale al cliente cómo le fue con su reciente compra y pídele amablemente una calificación.",
      isActive: false
    }
  ],
  services: [
    {
      name: "Recordatorio de Cita (24h antes)",
      description: "Envía un recordatorio de confirmación 24 horas antes de una reserva.",
      condition: "reservation_upcoming_24h",
      templateName: "appointment_reminder",
      systemPrompt: "Recuérdale amablemente al cliente sobre su cita de mañana. Proporciona la hora y cualquier instrucción necesaria.",
      isActive: false
    },
    {
      name: "Re-engagement (2 meses sin visita)",
      description: "Invita a clientes que no han reservado en 60 días a volver al negocio.",
      condition: "no_reservation_60d",
      templateName: "reengagement_offer",
      systemPrompt: "Dile al cliente que lo extrañamos y ofrécele revisar la disponibilidad para agendar una nueva cita.",
      isActive: false
    }
  ],
  restaurants: [
    {
      name: "Especiales de Viernes (VIP)",
      description: "Envía el menú especial a clientes con más de 3 reservaciones todos los viernes a las 11 AM.",
      condition: "vip_friday_promo",
      templateName: "friday_specials_vip",
      systemPrompt: "Saluda cálidamente a un cliente frecuente. Cuéntale sobre nuestros platillos especiales de hoy viernes e invítalo a reservar.",
      isActive: false
    }
  ]
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;
    const { category } = await request.json();
    
    if (!PRESETS[category]) {
      return NextResponse.json({ error: 'Categoría no válida' }, { status: 400 });
    }

    const db = adminDb;
    if (!db) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

    const companyDoc = await db.collection('companies').doc(companyId).get();
    if (!companyDoc.exists || companyDoc.data()?.ownerId !== userId) {
      return NextResponse.json({ error: 'Company not found or unauthorized' }, { status: 403 });
    }

    const batch = db.batch();
    const newTriggers: any[] = [];
    const triggersRef = db.collection('companies').doc(companyId).collection('triggers');

    PRESETS[category].forEach(preset => {
      const docRef = triggersRef.doc();
      const triggerData = {
        ...preset,
        createdAt: new Date().toISOString()
      };
      batch.set(docRef, triggerData);
      newTriggers.push({ id: docRef.id, ...triggerData });
    });

    await batch.commit();

    return NextResponse.json({ success: true, triggers: newTriggers });
  } catch (error) {
    console.error("POST triggers presets Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
