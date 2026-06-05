import sys

new_content = """import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { code, wabaId: clientWabaId, phoneId: clientPhoneId } = await req.json();

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
    
    const debugLogs: any = { tokenData };

    if (tokenData.error) {
      console.error("Error exchanging code:", tokenData.error);
      return NextResponse.json({ success: false, error: tokenData.error.message }, { status: 400 });
    }

    const accessToken = tokenData.access_token;

    // 2. Call debug_token to get the granular scopes and extract WABA ID
    const appAccessToken = `${clientId}|${clientSecret}`;
    const debugRes = await fetch(`https://graph.facebook.com/v19.0/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`);
    const debugData = await debugRes.json();
    debugLogs.debugData = debugData;

    if (debugData.error) {
      console.error("Error debugging token:", debugData.error);
    }

    const granularScopes = debugData.data?.granular_scopes || [];
    let wabaIds: string[] = [];

    if (clientWabaId) {
      wabaIds.push(clientWabaId);
    } else {
      const whatsappScopes = granularScopes.filter((s: any) => 
        s.scope === 'whatsapp_business_management' || 
        s.scope === 'whatsapp_business_messaging'
      );
      
      for (const scope of whatsappScopes) {
        if (scope.target_ids && scope.target_ids.length > 0) {
          wabaIds.push(...scope.target_ids);
        }
      }
    }

    // Fallback: If not found in granular_scopes, try via /me/businesses
    if (wabaIds.length === 0) {
      try {
        const bizRes = await fetch(`https://graph.facebook.com/v19.0/me/businesses?access_token=${accessToken}`);
        const bizData = await bizRes.json();
        debugLogs.bizData = bizData;
        
        if (bizData.data && bizData.data.length > 0) {
          debugLogs.businessWabaAttempts = [];
          for (const biz of bizData.data) {
            const waRes = await fetch(`https://graph.facebook.com/v19.0/${biz.id}/owned_whatsapp_business_accounts?access_token=${accessToken}`);
            const waData = await waRes.json();
            debugLogs.businessWabaAttempts.push({ type: 'owned', bizId: biz.id, data: waData });
            if (waData.data && waData.data.length > 0) {
              wabaIds.push(...waData.data.map((w: any) => w.id));
            }

            const clientWaRes = await fetch(`https://graph.facebook.com/v19.0/${biz.id}/client_whatsapp_business_accounts?access_token=${accessToken}`);
            const clientWaData = await clientWaRes.json();
            debugLogs.businessWabaAttempts.push({ type: 'client', bizId: biz.id, data: clientWaData });
            if (clientWaData.data && clientWaData.data.length > 0) {
              wabaIds.push(...clientWaData.data.map((w: any) => w.id));
            }
          }
        }
      } catch (e: any) {
        debugLogs.bizError = e.message;
        console.error("Fallback WABA fetch error:", e);
      }
    }

    wabaIds = [...new Set(wabaIds)]; // deduplicate

    // 3. Fetch Phone Numbers for all WABA IDs
    let availablePhones: any[] = [];
    let wabaName = "Mi Negocio de WhatsApp";

    for (const wId of wabaIds) {
      try {
        const phonesRes = await fetch(`https://graph.facebook.com/v19.0/${wId}/phone_numbers?access_token=${accessToken}`);
        const phonesData = await phonesRes.json();
        if (!debugLogs.phonesData) debugLogs.phonesData = {};
        debugLogs.phonesData[wId] = phonesData;
        
        if (phonesData.data && phonesData.data.length > 0) {
          for (const phone of phonesData.data) {
            availablePhones.push({
              id: phone.id,
              display_phone_number: phone.display_phone_number,
              verified_name: phone.verified_name,
              wabaId: wId
            });
            if (wabaName === "Mi Negocio de WhatsApp" && phone.verified_name) {
              wabaName = phone.verified_name;
            }
          }
        }
        
        // Also pre-fetch payment configuration for each WABA to have it ready
        const paymentRes = await fetch(`https://graph.facebook.com/v19.0/${wId}/payment_configurations?access_token=${accessToken}`);
        const paymentData = await paymentRes.json();
        let hasPayment = false;
        if (paymentData.data) {
          hasPayment = paymentData.data.length > 0;
        }
        
        // Attach hasPayment to the phones belonging to this WABA
        availablePhones = availablePhones.map((p) => p.wabaId === wId ? { ...p, hasPaymentMethod: hasPayment } : p);

      } catch (e) {
        console.error("Error fetching phones/payment for WABA", wId, e);
      }
    }

    if (availablePhones.length === 0) {
      debugLogs.phoneError = "No phone numbers found for WABAs " + wabaIds.join(", ");
    }

    // 4. Extract Facebook Page Info
    let availablePages: any[] = [];
    let instagramId = null;

    const igScope = granularScopes.find((s: any) => s.scope.startsWith('instagram_'));
    if (igScope && igScope.target_ids && igScope.target_ids.length > 0) {
      instagramId = igScope.target_ids[0]; 
    }

    try {
      const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesRes.json();
      
      if (!pagesData.error && pagesData.data && pagesData.data.length > 0) {
        // Collect all pages
        for (const page of pagesData.data) {
          // Fetch details for each page
          try {
            const detailRes = await fetch(`https://graph.facebook.com/v19.0/${page.id}?fields=name,about,phone,website,emails,instagram_business_account&access_token=${page.access_token}`);
            const detailData = await detailRes.json();
            
            availablePages.push({
              id: page.id,
              name: detailData.name || page.name,
              access_token: page.access_token,
              about: detailData.about || "",
              website: detailData.website || "",
              phone: detailData.phone || ""
            });

            if (!instagramId && detailData.instagram_business_account) {
              instagramId = detailData.instagram_business_account.id;
            }
          } catch(e) {
             availablePages.push({
              id: page.id,
              name: page.name,
              access_token: page.access_token,
              about: "", website: "", phone: ""
             });
          }
        }
      } else if (pagesData.error) {
        console.warn("Pages API error:", pagesData.error);
        const pageScope = granularScopes.find((s: any) => s.scope.startsWith('pages_'));
        if (pageScope && pageScope.target_ids && pageScope.target_ids.length > 0) {
          for (const pId of pageScope.target_ids) {
            availablePages.push({ id: pId, name: `Página ${pId}`, access_token: accessToken, about: "", website: "", phone: "" });
          }
        }
      }
    } catch(e) {
      console.error("Error fetching FB Pages info during embedded signup", e);
    }

    return NextResponse.json({
      success: true,
      accessToken,
      availablePhones,
      availablePages,
      instagramAccountId: instagramId,
      debugLogs
    });

  } catch (error: any) {
    console.error("Embedded signup extraction error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
"""

with open("src/app/api/onboarding/embedded-signup/route.ts", "w") as f:
    f.write(new_content)
