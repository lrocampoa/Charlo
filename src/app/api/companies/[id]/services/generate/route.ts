import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId || !adminDb) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: companyId } = await params;
    const compRef = await adminDb.collection('companies').doc(companyId).get();
    if (!compRef.exists || compRef.data()?.ownerId !== userId && compRef.data()?.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const companyData = compRef.data();
    const knowledgeBase = companyData?.knowledgeBase || "";

    if (!knowledgeBase || knowledgeBase.length < 10) {
      return NextResponse.json({ error: "Knowledge base is empty. Scrape a website first." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: "Name of the service or product." },
              type: { type: SchemaType.STRING, description: "'appointment' for 1-on-1s, 'event' for groups/tours." },
              durationMinutes: { type: SchemaType.INTEGER, description: "Duration in minutes. Default 30 if unknown." },
              capacity: { type: SchemaType.INTEGER, description: "Max people. Default 1 for appointments, 20 for events." },
              price: { type: SchemaType.INTEGER, description: "Price in local currency. Default 0 if unknown." }
            },
            required: ["name", "type", "durationMinutes", "capacity", "price"]
          }
        }
      }
    });

    const prompt = `You are a data extraction assistant. Read the following business knowledge base and extract any bookable services, classes, tours, or appointments mentioned. Output a JSON array matching the schema.

KNOWLEDGE BASE:
${knowledgeBase.slice(0, 20000)}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const services = JSON.parse(text);

    return NextResponse.json({ success: true, services });
  } catch (error: any) {
    console.error("Error generating services:", error);
    return NextResponse.json({ error: error.message || "Failed to generate services" }, { status: 500 });
  }
}
