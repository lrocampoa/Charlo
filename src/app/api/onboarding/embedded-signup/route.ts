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
    let name = "Mi Negocio de WhatsApp";

    if (wabaId) {
      const phonesRes = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/phone_numbers?access_token=${accessToken}`);
      const phonesData = await phonesRes.json();
      
      if (phonesData.data && phonesData.data.length > 0) {
        phoneId = phonesData.data[0].id;
        // Optionally get the verified name if available
        if (phonesData.data[0].verified_name) {
          name = phonesData.data[0].verified_name;
        } else if (phonesData.data[0].display_phone_number) {
          name = `Negocio (${phonesData.data[0].display_phone_number})`;
        }
      }
    }

    // Return everything to the frontend
    return NextResponse.json({
      success: true,
      accessToken,
      wabaId,
      phoneId,
      profileUpdate: {
        name: name,
        knowledgeBase: `ID de WhatsApp Business: ${wabaId || "Desconocido"}`,
      }
    });

  } catch (error: any) {
    console.error("Embedded signup extraction error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
