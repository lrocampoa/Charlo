import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ success: false, error: 'Missing code' }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ success: false, error: 'Missing Meta App credentials in server' }, { status: 500 });
    }

    // 1. Exchange code for System User Access Token
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("Error exchanging code:", tokenData.error);
      return NextResponse.json({ success: false, error: tokenData.error.message }, { status: 400 });
    }

    const accessToken = tokenData.access_token;

    // 2. Call debug_token to get the granular scopes and extract WABA ID
    // Note: We use the access_token itself as the input_token, and an app-level token for authentication
    const appAccessToken = `${clientId}|${clientSecret}`;
    const debugRes = await fetch(`https://graph.facebook.com/v19.0/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`);
    const debugData = await debugRes.json();

    if (debugData.error) {
      console.error("Error debugging token:", debugData.error);
    }

    let wabaId = null;
    const granularScopes = debugData.data?.granular_scopes || [];
    const whatsappScope = granularScopes.find((s: any) => s.scope === 'whatsapp_business_management');
    
    if (whatsappScope && whatsappScope.target_ids && whatsappScope.target_ids.length > 0) {
      wabaId = whatsappScope.target_ids[0];
    }

    // 3. Fetch Phone Number ID using the WABA ID
    let phoneId = null;
    let wabaName = "Mi Negocio de WhatsApp";

    if (wabaId) {
      const phonesRes = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/phone_numbers?access_token=${accessToken}`);
      const phonesData = await phonesRes.json();
      
      if (phonesData.data && phonesData.data.length > 0) {
        phoneId = phonesData.data[0].id;
        // Optionally get the verified name if available
        if (phonesData.data[0].verified_name) {
          wabaName = phonesData.data[0].verified_name;
        } else if (phonesData.data[0].display_phone_number) {
          wabaName = `Negocio (${phonesData.data[0].display_phone_number})`;
        }
      }
    }

    // 4. Extract Facebook Page Info
    let fbName = "";
    let about = "";
    let website = "";
    let fbPhone = "";
    let pageId = null;
    let instagramId = null;

    // Fallback: Extract from granular_scopes if /me/accounts fails
    const pageScope = granularScopes.find((s: any) => s.scope.startsWith('pages_'));
    if (pageScope && pageScope.target_ids && pageScope.target_ids.length > 0) {
      pageId = pageScope.target_ids[0];
    }
    const igScope = granularScopes.find((s: any) => s.scope.startsWith('instagram_'));
    if (igScope && igScope.target_ids && igScope.target_ids.length > 0) {
      instagramId = igScope.target_ids[0];
    }

    try {
      const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesRes.json();
      
      if (!pagesData.error && pagesData.data && pagesData.data.length > 0) {
        pageId = pagesData.data[0].id;
        const pageToken = pagesData.data[0].access_token;
        
        const detailRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=name,about,phone,website,emails,instagram_business_account&access_token=${pageToken}`);
        const detailData = await detailRes.json();

        if (detailData.name) fbName = detailData.name;
        if (detailData.about) about = detailData.about;
        if (detailData.website) website = detailData.website;
        if (detailData.phone) fbPhone = detailData.phone;
        if (detailData.instagram_business_account) {
          instagramId = detailData.instagram_business_account.id;
        }
      } else if (pagesData.error) {
        console.warn("Pages API error (might need to add scopes to Configuration):", pagesData.error);
        console.log("Full Debug Data to inspect available scopes:", JSON.stringify(debugData, null, 2));
      }
    } catch(e) {
      console.error("Error fetching FB Page info during embedded signup", e);
    }

    const finalName = fbName || wabaName;
    const finalKnowledgeBase = `ID de WhatsApp Business: ${wabaId || "Desconocido"}\n` +
      (fbPhone ? `Teléfono FB: ${fbPhone}\n` : "") +
      (website ? `Sitio Web: ${website}\n` : "") +
      (about ? `\nSobre nosotros:\n${about}` : "");

    // Return everything to the frontend
    return NextResponse.json({
      success: true,
      accessToken,
      wabaId,
      phoneId,
      facebookPageId: pageId,
      instagramAccountId: instagramId,
      profileUpdate: {
        name: finalName,
        knowledgeBase: finalKnowledgeBase,
      }
    });

  } catch (error: any) {
    console.error("Embedded signup extraction error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
