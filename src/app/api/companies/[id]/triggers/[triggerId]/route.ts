import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string, triggerId: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId, triggerId } = await params;
    const body = await request.json();
    const db = adminDb;
    if (!db) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

    const companyDoc = await db.collection('companies').doc(companyId).get();
    if (!companyDoc.exists || companyDoc.data()?.ownerId !== userId) {
      return NextResponse.json({ error: 'Company not found or unauthorized' }, { status: 403 });
    }

    await db.collection('companies').doc(companyId).collection('triggers').doc(triggerId).update({
      isActive: body.isActive
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT triggers Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
