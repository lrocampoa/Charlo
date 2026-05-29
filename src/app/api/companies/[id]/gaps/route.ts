import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';
import { getKnowledgeGaps, updateKnowledgeGap } from '@/lib/firebase/dbUtils';
import { createCompanyCache, deleteCompanyCache } from '@/lib/ai/cachingService';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;
    
    // Auth check
    if (!adminDb) return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    const companyRef = adminDb.collection('companies').doc(companyId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists || companyDoc.data()?.ownerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const gaps = await getKnowledgeGaps(companyId);
    return NextResponse.json({ gaps });
  } catch (error) {
    console.error("Gaps GET Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;
    const { gapId, question, resolutionText } = await request.json();

    if (!companyId || !gapId || !resolutionText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Auth check
    if (!adminDb) return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    const companyRef = adminDb.collection('companies').doc(companyId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists || companyDoc.data()?.ownerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const currentData = companyDoc.data() || {};
    const existingSOPs = currentData.advancedSOPs || "";
    
    // Append the new SOP
    const newSOPBlock = `\n\n[SOP Agregado Automáticamente]:\nPregunta/Caso: ${question}\nProcedimiento/Respuesta: ${resolutionText}`;
    const updatedSOPs = existingSOPs + newSOPBlock;

    // Delete old cache if exists
    if (currentData.geminiCacheId) {
      await deleteCompanyCache(currentData.geminiCacheId);
    }

    let cacheName = null;
    let cacheExpiry = null;

    // Rebuild cache
    try {
      cacheName = await createCompanyCache(companyId, updatedSOPs, currentData.persona);
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24);
      cacheExpiry = expiry.toISOString();
    } catch (err) {
      console.error("Failed to build Gemini Cache during gap resolution:", err);
      // We still want to save the text even if cache fails, so we don't throw 500 immediately.
    }

    // Update Company Doc
    await companyRef.update({
      advancedSOPs: updatedSOPs,
      geminiCacheId: cacheName,
      geminiCacheExpiry: cacheExpiry,
      lastUpdated: new Date().toISOString()
    });

    // Mark gap as resolved
    await updateKnowledgeGap(companyId, gapId, { 
      status: 'resolved', 
      resolutionText 
    });

    return NextResponse.json({ success: true, message: 'Brecha de conocimiento resuelta y Cerebro AI actualizado.' });
  } catch (error) {
    console.error("Gaps PUT Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
