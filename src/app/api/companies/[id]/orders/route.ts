import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId || !adminDb) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: companyId } = await params;

    // Optional: Verify that this company belongs to the user
    const compRef = await adminDb.collection('companies').doc(companyId).get();
    if (!compRef.exists || compRef.data()?.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const snapshot = await adminDb.collection('companies').doc(companyId).collection('orders').orderBy('createdAt', 'desc').limit(50).get();
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
