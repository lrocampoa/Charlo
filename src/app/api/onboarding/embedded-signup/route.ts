import { NextResponse } from 'next/server';

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
    
    let debugLogs: any = { tokenData };

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
    debugLogs.debugData = debugData;

    if (debugData.error) {
      console.error("Error debugging token:", debugData.error);
    }

    let wabaId = clientWabaId || null;
    const granularScopes = debugData.data?.granular_scopes || [];
    
    if (!wabaId) {
      const whatsappScopes = granularScopes.filter((s: any) => 
        s.scope === 'whatsapp_business_management' || 
        s.scope === 'whatsapp_business_messaging'
      );
      
      for (const scope of whatsappScopes) {
        if (scope.target_ids && scope.target_ids.length > 0) {
          wabaId = scope.target_ids[0];
          break;
        }
      }
    }

    // Fallback: If not found in granular_scopes, try via /me/businesses
    if (!wabaId) {
      try {
        const bizRes = await fetch(`https://graph.facebook.com/v19.0/me/businesses?access_token=${accessToken}`);
        const bizData = await bizRes.json();
        debugLogs.bizData = bizData;
        
        if (bizData.data && bizData.data.length > 0) {
          debugLogs.businessWabaAttempts = [];
          for (const biz of bizData.data) {
            // Check owned
            const waRes = await fetch(`https://graph.facebook.com/v19.0/${biz.id}/owned_whatsapp_business_accounts?access_token=${accessToken}`);
            const waData = await waRes.json();
            debugLogs.businessWabaAttempts.push({ type: 'owned', bizId: biz.id, data: waData });
            if (waData.data && waData.data.length > 0) {
              wabaId = waData.data[0].id;
              break;
            }
            // Check client
            const clientWaRes = await fetch(`https://graph.facebook.com/v19.0/${biz.id}/client_whatsapp_business_accounts?access_token=${accessToken}`);
            const clientWaData = await clientWaRes.json();
            debugLogs.businessWabaAttempts.push({ type: 'client', bizId: biz.id, data: clientWaData });
            if (clientWaData.data && clientWaData.data.length > 0) {
              wabaId = clientWaData.data[0].id;
              break;
            }
          }
        }
      } catch (e: any) {
        debugLogs.bizError = e.message;
        console.error("Fallback WABA fetch error:", e);
      }
    }

    // 3. Fetch Phone Number ID using the WABA ID
    let phoneId = clientPhoneId || null;
    let wabaName = "Mi Negocio de WhatsApp";

    if (wabaId) {
      const phonesRes = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/phone_numbers?access_token=${accessToken}`);
      const phonesData = await phonesRes.json();
      debugLogs.phonesData = phonesData;
      
      if (!phoneId && phonesData.data && phonesData.data.length > 0) {
        phoneId = phonesData.data[0].id;
      }
      
      if (!phoneId) {
        debugLogs.phoneError = "No phone numbers found for WABA " + wabaId;
      }
      
      if (phonesData.data && phonesData.data.length > 0) {
        if (phonesData.data[0].verified_name) {
          wabaName = phonesData.data[0].verified_name;
        } else if (phonesData.data[0].display_phone_number) {
          wabaName = `Negocio (${phonesData.data[0].display_phone_number})`;
        }
      } else {
        console.warn("Phones fetch returned empty or error:", phonesData);
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
        
        const detailRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=name,about,phone,website,emails,instagram_business_account,business&access_token=${pageToken}`);
        const detailData = await detailRes.json();
        debugLogs.pageDetailData = detailData;

        if (detailData.name) fbName = detailData.name;
        if (detailData.about) about = detailData.about;
        if (detailData.website) website = detailData.website;
        if (detailData.phone) fbPhone = detailData.phone;
        if (detailData.instagram_business_account) {
          instagramId = detailData.instagram_business_account.id;
        }

        // Additional WABA Fallback using Page's linked Business
        if (!wabaId && detailData.business && detailData.business.id) {
          const bizId = detailData.business.id;
          try {
            const waRes = await fetch(`https://graph.facebook.com/v19.0/${bizId}/owned_whatsapp_business_accounts?access_token=${accessToken}`);
            const waData = await waRes.json();
            debugLogs.pageBusinessOwnedWaData = waData;
            if (waData.data && waData.data.length > 0) {
              wabaId = waData.data[0].id;
            } else {
              const clientWaRes = await fetch(`https://graph.facebook.com/v19.0/${bizId}/client_whatsapp_business_accounts?access_token=${accessToken}`);
              const clientWaData = await clientWaRes.json();
              debugLogs.pageBusinessClientWaData = clientWaData;
              if (clientWaData.data && clientWaData.data.length > 0) {
                wabaId = clientWaData.data[0].id;
              }
            }
          } catch (e: any) {
            debugLogs.pageBusinessError = e.message;
            console.error("Page Business WABA fetch error:", e);
          }
          
          // Re-attempt phone fetch if we just found the WABA ID
          if (wabaId && !phoneId) {
            try {
              const phonesRes = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/phone_numbers?access_token=${accessToken}`);
              const phonesData = await phonesRes.json();
              if (phonesData.data && phonesData.data.length > 0) {
                phoneId = phonesData.data[0].id;
              }
            } catch (e) {}
          }
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
      },
      debugLogs // Expose for client-side debugging
    });

  } catch (error: any) {
    console.error("Embedded signup extraction error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
