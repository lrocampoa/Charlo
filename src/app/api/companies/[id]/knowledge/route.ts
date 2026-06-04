import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken, verifyActiveSubscription } from '@/lib/firebase/admin';
import { getDataSources, deleteDataSource } from '@/lib/firebase/dbUtils';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;
    const sources = await getDataSources(companyId);
    
    return NextResponse.json({ sources });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;
    
    const isActive = await verifyActiveSubscription(companyId);
    if (!isActive) return NextResponse.json({ error: "Subscription inactive or past due." }, { status: 402 });

    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');

    if (!sourceId) return NextResponse.json({ error: 'Source ID required' }, { status: 400 });

    await deleteDataSource(companyId, sourceId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
