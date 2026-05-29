import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';
import { createReservation } from '@/lib/bookings/bookingService';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId || !adminDb) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: companyId } = await params;

    const compRef = await adminDb.collection('companies').doc(companyId).get();
    if (!compRef.exists || compRef.data()?.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const snapshot = await adminDb.collection('companies').doc(companyId).collection('reservations').orderBy('createdAt', 'desc').limit(50).get();
    const reservations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId || !adminDb) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: companyId } = await params;
    const compRef = await adminDb.collection('companies').doc(companyId).get();
    if (!compRef.exists || compRef.data()?.ownerId !== userId && compRef.data()?.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.serviceId || !body.date || !body.time || !body.customerName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await createReservation({
      companyId,
      ...body
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error creating reservation via API:", error);
    return NextResponse.json({ error: error.message || "Failed to create reservation" }, { status: 500 });
  }
}
