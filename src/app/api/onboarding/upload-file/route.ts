import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { verifyIdToken } from '@/lib/firebase/admin';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let extractedText = '';
    const mimeType = file.type;
    const isPdf = mimeType === 'application/pdf';
    const isImage = mimeType.startsWith('image/');

    if (!isPdf && !isImage) {
      return NextResponse.json({ error: 'Unsupported file type. Please upload a PDF or Image.' }, { status: 400 });
    }

    // Parse Document/Image with Gemini 1.5 Flash natively!
    const base64Data = buffer.toString('base64');
    
    const schema = {
      type: SchemaType.OBJECT,
      properties: {
        businessName: { type: SchemaType.STRING },
        knowledgeBase: { type: SchemaType.STRING, description: "All rules, SOPs, facts, excluding products. Format as clean markdown." },
        products: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              price: { type: SchemaType.NUMBER },
              currency: { type: SchemaType.STRING, description: "e.g., CRC, USD. Try to deduce from text." }
            },
            required: ["name"]
          }
        }
      },
      required: ["businessName", "knowledgeBase", "products"]
    };

    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema as any,
      }
    });

    const result = await model.generateContent([
      "Extract all readable text, menus, pricing, facts, and rules from this document/image. Separate actual products/services from general business info. Do not invent information.",
      { inlineData: { data: base64Data, mimeType } }
    ]);
    
    let data;
    try {
      data = JSON.parse(result.response.text());
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse AI output' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      profileUpdate: {
        name: data.businessName || "Mi Negocio",
        topics: [
          {
            id: 'conocimiento',
            title: 'Base de Conocimiento General',
            content: `Extraído de archivo ${file.name}:\n\n${data.knowledgeBase}`
          }
        ]
      },
      extractedProducts: data.products || []
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to upload and parse file' }, { status: 500 });
  }
}
