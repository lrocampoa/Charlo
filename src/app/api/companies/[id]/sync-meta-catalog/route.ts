import { NextResponse } from 'next/server';
import { getCompanyConfig, getUser } from '@/lib/firebase/dbUtils';
import { verifyIdToken } from '@/lib/firebase/admin';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: companyId } = await params;
    const company = await getCompanyConfig(companyId);

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (company.ownerId !== userId) {
      return NextResponse.json({ error: "Unauthorized. You are not the owner of this company." }, { status: 403 });
    }

    const userDoc: any = await getUser(userId);
    const tier = userDoc?.subscription?.tier || 'free';

    // Must be at least starter
    if (tier === 'free') {
      return NextResponse.json({ error: "Sync to Meta requires a Starter plan or higher." }, { status: 403 });
    }

    const { metaToken, whatsappPhoneNumberId } = company;

    if (!metaToken || !whatsappPhoneNumberId) {
      return NextResponse.json({ error: "Company is not connected to Meta." }, { status: 400 });
    }

    const { extractedProducts } = await request.json();

    if (!extractedProducts || !Array.isArray(extractedProducts) || extractedProducts.length === 0) {
      return NextResponse.json({ error: "No products provided to sync." }, { status: 400 });
    }

    // 1. Fetch WABA to get Business ID
    const wabaRes = await fetch(`https://graph.facebook.com/v19.0/${whatsappPhoneNumberId}?fields=id,business&access_token=${metaToken}`);
    const wabaData = await wabaRes.json();
    
    if (!wabaData.business || !wabaData.business.id) {
      return NextResponse.json({ error: "Could not find Business ID linked to this WhatsApp account." }, { status: 400 });
    }
    const businessId = wabaData.business.id;

    // 2. Check if a catalog already exists for this business
    const catalogsRes = await fetch(`https://graph.facebook.com/v19.0/${businessId}/owned_product_catalogs?access_token=${metaToken}`);
    const catalogsData = await catalogsRes.json();

    let catalogId = null;

    if (catalogsData.data && catalogsData.data.length > 0) {
      // Pick the first one for now, or look for a Charlo catalog
      const charloCatalog = catalogsData.data.find((c: any) => c.name.includes("Charlo"));
      catalogId = charloCatalog ? charloCatalog.id : catalogsData.data[0].id;
    } else {
      // 3. Create a new Catalog
      const createCatalogRes = await fetch(`https://graph.facebook.com/v19.0/${businessId}/owned_product_catalogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Catálogo de Charlo - ${company.name}`,
          access_token: metaToken
        })
      });
      const createCatalogData = await createCatalogRes.json();
      
      if (createCatalogData.error) {
        console.error("Error creating Meta catalog:", createCatalogData.error);
        return NextResponse.json({ error: "Failed to create Meta Catalog. Make sure 'catalog_management' permission is granted." }, { status: 500 });
      }
      catalogId = createCatalogData.id;
    }

    // 4. Batch Upload Products
    const batchRequests = extractedProducts.map((product: any, index: number) => ({
      method: "CREATE",
      retailer_id: `charlo_${Date.now()}_${index}`,
      data: {
        name: product.name,
        description: product.description || "Sin descripción",
        price: parseInt((product.price || 0).toString().replace(/[^0-9]/g, '')) * 100, // Meta expects price in cents (e.g. 1000 = $10.00)
        currency: product.currency || 'CRC',
        url: "https://charlo.ai", // Required field for Meta Products
        brand: company.name
      }
    }));

    const batchRes = await fetch(`https://graph.facebook.com/v19.0/${catalogId}/items_batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: metaToken,
        requests: batchRequests,
        item_type: "PRODUCT_ITEM"
      })
    });
    
    const batchData = await batchRes.json();

    if (batchData.error) {
      console.error("Batch upload error:", batchData.error);
      return NextResponse.json({ error: "Failed to upload items to Meta Catalog." }, { status: 500 });
    }

    return NextResponse.json({ success: true, catalogId, handles: batchData.handles });

  } catch (error: any) {
    console.error("Meta sync error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
