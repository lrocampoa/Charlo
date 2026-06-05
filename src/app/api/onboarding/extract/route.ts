import { verifyIdToken } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const userId = await verifyIdToken(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { provider, token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    let profileUpdate: Record<string, unknown> = {};

    if (provider === 'google') {
      // 1. Get Accounts
      const accRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const accData = await accRes.json();
      
      if (accData.error) throw new Error(accData.error.message);
      if (!accData.accounts || accData.accounts.length === 0) {
        throw new Error("No se encontraron cuentas de negocio en Google.");
      }

      // 2. Get Locations for the first account
      const accountName = accData.accounts[0].name;
      const locRes = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const locData = await locRes.json();
      
      if (!locData.locations || locData.locations.length === 0) {
        throw new Error("No se encontraron ubicaciones para este negocio en Google.");
      }

      const loc = locData.locations[0];
      const title = loc.title || "Negocio de Google";
      const phone = loc.phoneNumbers?.primaryPhone || "";
      const website = loc.websiteUri || "";
      const address = loc.storefrontAddress?.addressLines?.join(", ") || "";
      
      let hoursStr = "Horarios:\n";
      if (loc.regularHours?.periods) {
        loc.regularHours.periods.forEach((p: Record<string, unknown>) => {
          hoursStr += `- Día ${p.openDay}: ${p.openTime} a ${p.closeTime}\n`;
        });
      }

      profileUpdate = {
        name: title,
        knowledgeBase: `Extraído de Google Business:\nUbicación: ${address}\nTeléfono: ${phone}\nSitio Web: ${website}\n\n${hoursStr}`,
      };
    } 
    else if (provider === 'facebook') {
      // 1. Get Facebook Pages
      const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`);
      const pagesData = await pagesRes.json();

      let pageId = null;
      let pageToken = token;
      
      if (!pagesData.error && pagesData.data && pagesData.data.length > 0) {
        pageId = pagesData.data[0].id;
        pageToken = pagesData.data[0].access_token;
      }

      let name = "Mi Negocio";
      let about = "";
      let phone = "";
      let website = "";
      let waba = null;

      if (pageId) {
        // 2. Get Details of the first page
        try {
          const detailRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=name,about,phone,website,emails,whatsapp_business_account&access_token=${pageToken}`);
          const detailData = await detailRes.json();

          if (detailData.name) name = detailData.name;
          if (detailData.about) about = detailData.about;
          if (detailData.phone) phone = detailData.phone;
          if (detailData.website) website = detailData.website;
          if (detailData.whatsapp_business_account?.id) waba = detailData.whatsapp_business_account.id;
        } catch(e) { console.error("Error fetching page details", e); }
      }
      
      let actualPhoneId = null;
      if (waba) {
        try {
          const phonesRes = await fetch(`https://graph.facebook.com/v19.0/${waba}/phone_numbers?access_token=${token}`);
          const phonesData = await phonesRes.json();
          if (phonesData.data && phonesData.data.length > 0) {
            actualPhoneId = phonesData.data[0].id;
          }
        } catch(e) { console.error("Error fetching WABA phones", e); }
      }

      profileUpdate = {
        name: name,
        knowledgeBase: `Extraído de Facebook:\nSobre nosotros: ${about}\nTeléfono: ${phone}\nSitio Web: ${website}\nID de WhatsApp Business: ${waba || "No conectado a WhatsApp API"}`,
      };

      return NextResponse.json({ success: true, profileUpdate, extractedPhoneId: actualPhoneId });
    }

    return NextResponse.json({ success: true, profileUpdate });
    
  } catch (error: unknown) {
    console.error("Extraction error:", error);
    const msg = error instanceof Error ? error.message : "Extraction failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
