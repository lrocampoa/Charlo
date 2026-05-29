import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';
import { createCompanyCache, deleteCompanyCache } from '@/lib/ai/cachingService';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;
    const { advancedSOPs, persona } = await request.json();

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const db = adminDb;
    if (!db) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

    const companyRef = db.collection('companies').doc(companyId);
    const companyDoc = await companyRef.get();
    
    if (!companyDoc.exists || companyDoc.data()?.ownerId !== userId) {
      return NextResponse.json({ error: 'Company not found or unauthorized' }, { status: 403 });
    }

    const currentData = companyDoc.data();
    
    // If they already have a cache, delete it to prevent memory leaks
    if (currentData?.geminiCacheId) {
      await deleteCompanyCache(currentData.geminiCacheId);
    }

    let cacheName = null;
    let cacheExpiry = null;

    // Fetch all active data sources
    const dataSourcesSnapshot = await companyRef.collection('data_sources').get();

    // Parse SOP Cards if it's JSON
    let xmlSops = "";
    if (advancedSOPs) {
      try {
        const cards = JSON.parse(advancedSOPs);
        if (Array.isArray(cards)) {
          xmlSops = "<standard_operating_procedures>\n";
          cards.forEach(card => {
            if (card.title || card.content) {
              xmlSops += `  <procedure name="${card.title || 'Untitled'}">\n    ${card.content || ''}\n  </procedure>\n`;
            }
          });
          xmlSops += "</standard_operating_procedures>";
        } else {
          xmlSops = advancedSOPs; // Fallback
        }
      } catch (e) {
        xmlSops = advancedSOPs; // Fallback
      }
    }

    let masterKnowledgeText = xmlSops + "\n";
    
    dataSourcesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.extractedText) {
        masterKnowledgeText += `\n\n<document name="${data.name}">\n${data.extractedText}\n</document>`;
      }
    });

    // Build the new cache if they provided Advanced SOPs or Data Sources
    if (masterKnowledgeText.trim().length > 0) {
      try {
         // Create new cache
         cacheName = await createCompanyCache(companyId, masterKnowledgeText, persona || currentData?.persona);
         const expiry = new Date();
         expiry.setHours(expiry.getHours() + 24);
         cacheExpiry = expiry.toISOString();
      } catch (err) {
         console.error("Failed to build Gemini Cache:", err);
         return NextResponse.json({ error: 'Failed to build AI Cache. SOPs might be too large or malformed.' }, { status: 500 });
      }
    }

    // Save advanced SOPs and Cache ID to Firebase
    await companyRef.update({
      advancedSOPs: advancedSOPs || "",
      geminiCacheId: cacheName,
      geminiCacheExpiry: cacheExpiry,
      lastUpdated: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      cacheId: cacheName,
      message: cacheName ? 'AI Brain built successfully!' : 'SOPs cleared.' 
    });
  } catch (error) {
    console.error("Advanced SOPs API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
