import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';
import { getCompanySessions, getCompanyConfig } from '@/lib/firebase/dbUtils';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;
    
    // Verify Ownership
    const company = await getCompanyConfig(companyId);
    if (!company || company.ownerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch recent sessions
    const sessions = await getCompanySessions(companyId);
    
    // Sort by most recent and limit to 50 to avoid massive token usage
    const recentSessions = sessions
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, 50);

    if (recentSessions.length === 0) {
      return NextResponse.json({ faqs: [] });
    }

    // Extract raw text from sessions to feed into Gemini
    let conversationData = '';
    recentSessions.forEach((session, idx) => {
      conversationData += `\n--- Session ${idx + 1} ---\n`;
      session.history?.forEach((msg: any) => {
        const text = msg.parts?.[0]?.text || '';
        if (text) {
          conversationData += `[${msg.role === 'model' ? 'AI' : 'Customer'}]: ${text}\n`;
        }
      });
    });

    if (conversationData.trim().length === 0) {
       return NextResponse.json({ faqs: [] });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            faqs: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  question: { type: SchemaType.STRING, description: "The most common question asked by customers, phrased clearly." },
                  answer: { type: SchemaType.STRING, description: "The ideal answer based on how the AI usually responds, or what it *should* respond." },
                  frequencyCount: { type: SchemaType.NUMBER, description: "The estimated number of times this question was asked across all provided sessions." }
                },
                required: ["question", "answer", "frequencyCount"]
              }
            }
          },
          required: ["faqs"]
        }
      }
    });

    const prompt = `You are a data analyst reviewing customer support logs. Analyze the following conversation transcripts and extract the Top 5 to 10 most frequently asked questions. 
Group similar questions together. For each FAQ, provide the question, the ideal response based on the AI's actual answers, and an estimated count of how many times it was asked.

CONVERSATION TRANSCRIPTS:
${conversationData.substring(0, 80000)} // Limiting to 80k chars to be safe
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonResponse = JSON.parse(text);

    // Sort by highest frequency
    if (jsonResponse.faqs && Array.isArray(jsonResponse.faqs)) {
      jsonResponse.faqs.sort((a: any, b: any) => b.frequencyCount - a.frequencyCount);
    }

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Generate FAQs Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
