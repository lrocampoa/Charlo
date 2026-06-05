import { NextResponse } from 'next/server';
import { verifyIdToken, adminDb } from '@/lib/firebase/admin';
import { getUser } from '@/lib/firebase/dbUtils';

export async function POST(request: Request) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { draftId, ...draftData } = body;

    let idToUse = draftId;
    
    // If no draft ID, create a new one
    if (!idToUse) {
      idToUse = `company_${Date.now()}_draft`;
      await adminDb?.collection('companies').doc(idToUse).set({
        id: idToUse,
        ownerId: userId,
        status: 'draft',
        name: draftData.profile?.name || 'Borrador de Empresa',
        draftData: draftData,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    } else {
      // Update existing draft
      // Verify ownership first
      const doc = await adminDb?.collection('companies').doc(idToUse).get();
      if (!doc?.exists || doc.data()?.ownerId !== userId) {
        return NextResponse.json({ error: "Unauthorized or draft not found" }, { status: 403 });
      }

      await adminDb?.collection('companies').doc(idToUse).update({
        name: draftData.profile?.name || 'Borrador de Empresa',
        draftData: draftData,
        lastUpdated: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, draftId: idToUse });
  } catch (error) {
    console.error("Draft POST Error:", error);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');

    if (!draftId) {
      return NextResponse.json({ error: "Draft ID required" }, { status: 400 });
    }

    const doc = await adminDb?.collection('companies').doc(draftId).get();
    if (!doc?.exists || doc.data()?.ownerId !== userId) {
      return NextResponse.json({ error: "Draft not found or unauthorized" }, { status: 403 });
    }

    return NextResponse.json(doc.data());
  } catch (error) {
    console.error("Draft GET Error:", error);
    return NextResponse.json({ error: "Failed to load draft" }, { status: 500 });
  }
}
