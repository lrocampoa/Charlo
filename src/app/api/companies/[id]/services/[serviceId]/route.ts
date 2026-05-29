import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string, serviceId: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId, serviceId } = await params;
    const body = await request.json();
    const db = adminDb;
    if (!db) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

    await db.collection('companies').doc(companyId).collection('services').doc(serviceId).update(body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT service Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string, serviceId: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId, serviceId } = await params;
    const db = adminDb;
    if (!db) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

    await db.collection('companies').doc(companyId).collection('services').doc(serviceId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE service Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
