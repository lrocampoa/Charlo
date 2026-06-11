import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';

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

    const companyData = companyDoc.data();
    const wabaId = companyData?.wabaId;
    const metaAccessToken = companyData?.metaAccessToken;

    if (!wabaId || !metaAccessToken) {
      return NextResponse.json({ templates: [] });
    }

    const res = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/message_templates?access_token=${metaAccessToken}`);
    const data = await res.json();

    if (data.error) {
      console.error("Meta API Error:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({ templates: data.data || [] });
  } catch (error) {
    console.error("Templates GET Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;
    const body = await request.json();
    const { name, category, language, bodyText, optOutButton } = body;

    if (!name || !category || !language || !bodyText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Auth check
    if (!adminDb) return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    const companyRef = adminDb.collection('companies').doc(companyId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists || companyDoc.data()?.ownerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const companyData = companyDoc.data();
    const wabaId = companyData?.wabaId;
    const metaAccessToken = companyData?.metaAccessToken;

    if (!wabaId || !metaAccessToken) {
      return NextResponse.json({ error: 'WhatsApp Business Account not fully configured' }, { status: 400 });
    }

    let sanitizedBodyText = bodyText.trim();
    if (sanitizedBodyText.startsWith('{{')) {
      sanitizedBodyText = ' ' + sanitizedBodyText;
    }
    if (sanitizedBodyText.endsWith('}}')) {
      sanitizedBodyText += '.';
    }

    // Prepare components payload
    const components: any[] = [
      {
        type: "BODY",
        text: sanitizedBodyText
      }
    ];

    // If there are variables, inject example samples automatically to improve approval odds
    // Finds all {{X}} variables
    const matches = bodyText.match(/\{\{\d+\}\}/g);
    if (matches && matches.length > 0) {
      // Create a unique set of variable numbers
      const numVars = new Set(matches.map((m: string) => m.match(/\d+/)?.[0]));
      const exampleArray = Array.from(numVars).map(() => "Texto de prueba");
      
      components[0].example = {
        body_text: [exampleArray]
      };
    }

    // Add optional Opt-out button
    if (optOutButton) {
      components.push({
        type: "BUTTONS",
        buttons: [
          {
            type: "QUICK_REPLY",
            text: optOutButton
          }
        ]
      });
    }

    const payload = {
      name: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'), // Ensure valid name format
      category,
      language,
      components
    };

    const res = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/message_templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${metaAccessToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.error) {
      console.error("Meta Template Creation Error:", JSON.stringify(data.error, null, 2));
      const detailedMessage = data.error.error_user_msg || (data.error.error_data && data.error.error_data.details) || data.error.message;
      return NextResponse.json({ error: detailedMessage, fullError: data.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error("Templates POST Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
