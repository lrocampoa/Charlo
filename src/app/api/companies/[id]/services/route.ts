import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;
    const db = adminDb;
    if (!db) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

    const snapshot = await db.collection('companies').doc(companyId).collection('services').get();
    const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error("GET services Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;
    const body = await request.json();
    const db = adminDb;
    if (!db) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

    const docRef = await db.collection('companies').doc(companyId).collection('services').add({
      ...body,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, service: { id: docRef.id, ...body } });
  } catch (error) {
    console.error("POST services Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
