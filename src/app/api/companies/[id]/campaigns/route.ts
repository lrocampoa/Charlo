import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';
import { getCustomersByCompany, getCompanyConfig, saveCampaign, getCampaigns } from '@/lib/firebase/dbUtils';

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

    const campaigns = await getCampaigns(companyId);
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Campaigns GET Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;
    const { templateName, languageCode, targetPhones } = await request.json();

    if (!templateName || !languageCode) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (Template Name o Language Code)' }, { status: 400 });
    }

    // Auth & Config check
    const company = await getCompanyConfig(companyId);
    if (!company || company.ownerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const accessToken = company.metaAccessToken || process.env.WHATSAPP_TOKEN;
    const businessPhoneId = company.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !businessPhoneId) {
      return NextResponse.json({ error: 'Configura WhatsApp en la sección de Ajustes primero.' }, { status: 400 });
    }

    // Fetch CRM
    let customers = await getCustomersByCompany(companyId);
    
    // Filter if specific targets were provided
    if (targetPhones && Array.isArray(targetPhones) && targetPhones.length > 0) {
      customers = customers.filter(c => targetPhones.includes(c.customerId));
    }

    if (customers.length === 0) {
      return NextResponse.json({ error: 'No hay clientes en el CRM (o en la selección) para enviar la campaña.' }, { status: 400 });
    }

    let sentCount = 0;
    let failedCount = 0;

    // Send the messages
    for (const customer of customers) {
      try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${businessPhoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: customer.customerId, // assuming customerId is the phone number
            type: "template",
            template: {
              name: templateName,
              language: {
                code: languageCode
              }
            }
          })
        });

        if (res.ok) {
          sentCount++;
        } else {
          console.error(`Meta API Error for ${customer.customerId}:`, await res.text());
          failedCount++;
        }
      } catch (e) {
        console.error(`Failed to send to ${customer.customerId}`, e);
        failedCount++;
      }
    }

    // Save campaign history
    const campaignData = {
      templateName,
      languageCode,
      audienceSize: customers.length,
      sentCount,
      failedCount,
      status: failedCount === 0 ? 'success' : (sentCount > 0 ? 'partial' : 'failed')
    };

    await saveCampaign(companyId, campaignData);

    return NextResponse.json({ success: true, campaign: campaignData });
  } catch (error) {
    console.error("Campaigns POST Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
