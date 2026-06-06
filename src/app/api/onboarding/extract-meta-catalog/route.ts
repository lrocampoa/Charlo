import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { metaToken, whatsappPhoneNumberId, facebookPageId } = await req.json();

    if (!metaToken) {
      return NextResponse.json({ success: false, error: 'Missing metaToken' }, { status: 400 });
    }

    if (!whatsappPhoneNumberId && !facebookPageId) {
      return NextResponse.json({ success: false, error: 'Missing identity IDs (phone or page)' }, { status: 400 });
    }

    let businessId = null;

    // 1. Try to fetch Business ID via WhatsApp
    if (whatsappPhoneNumberId) {
      const waRes = await fetch(`https://graph.facebook.com/v19.0/${whatsappPhoneNumberId}?fields=business&access_token=${metaToken}`);
      const waData = await waRes.json();
      if (waData.business?.id) {
        businessId = waData.business.id;
      }
    }

    // 2. Fallback: Try to fetch Business ID via Facebook Page
    if (!businessId && facebookPageId) {
      const pageRes = await fetch(`https://graph.facebook.com/v19.0/${facebookPageId}?fields=business&access_token=${metaToken}`);
      const pageData = await pageRes.json();
      if (pageData.business?.id) {
        businessId = pageData.business.id;
      }
    }

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Could not find a Business ID associated with this account' }, { status: 404 });
    }

    // 3. Fetch Catalogs
    const catalogsRes = await fetch(`https://graph.facebook.com/v19.0/${businessId}/owned_product_catalogs?fields=id,name,product_count&access_token=${metaToken}`);
    const catalogsData = await catalogsRes.json();

    if (!catalogsData.data || catalogsData.data.length === 0) {
      return NextResponse.json({ success: true, extractedProducts: [] });
    }

    // Filter out catalogs that have 0 products to save API calls
    const activeCatalogs = catalogsData.data.filter((c: any) => c.product_count > 0);
    
    if (activeCatalogs.length === 0) {
      return NextResponse.json({ success: true, extractedProducts: [] });
    }

    // Pick the one with the most products
    activeCatalogs.sort((a: any, b: any) => b.product_count - a.product_count);
    const catalogId = activeCatalogs[0].id;

    // 4. Fetch Products from chosen catalog
    // Fetch up to 50 products for onboarding context
    const productsRes = await fetch(`https://graph.facebook.com/v19.0/${catalogId}/products?fields=id,name,description,price,currency,image_url&limit=50&access_token=${metaToken}`);
    const productsData = await productsRes.json();

    if (!productsData.data || productsData.data.length === 0) {
      return NextResponse.json({ success: true, extractedProducts: [] });
    }

    const extractedProducts = productsData.data.map((p: any) => ({
      id: p.id,
      name: p.name || '',
      description: p.description || '',
      price: p.price ? parseFloat(p.price).toString() : '',
      currency: p.price && p.price.includes(' ') ? p.price.split(' ')[1] : (p.currency || 'CRC'),
      imageUrl: p.image_url || ''
    }));

    return NextResponse.json({ 
      success: true, 
      catalogId,
      extractedProducts 
    });

  } catch (error: any) {
    console.error("Extract Meta Catalog Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
