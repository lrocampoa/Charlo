import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken, verifyActiveSubscription } from '@/lib/firebase/admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { trackGeminiUsage } from '@/lib/firebase/dbUtils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;
    const { prompt, category, language } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Falta el prompt' }, { status: 400 });
    }

    const isActive = await verifyActiveSubscription(companyId);
    if (!isActive) return NextResponse.json({ error: "Subscription inactive or past due." }, { status: 402 });

    // Auth check
    if (!adminDb) return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    const companyRef = adminDb.collection('companies').doc(companyId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists || companyDoc.data()?.ownerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API Key missing" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: `Actúa como un experto copywriter de marketing para WhatsApp.
Tu objetivo es generar plantillas (templates) de WhatsApp para empresas.
Categoría deseada: ${category}
Idioma deseado: ${language}

Reglas estrictas e inquebrantables de Meta (WhatsApp Business Policy):
1. El texto NO DEBE superar los 1024 caracteres.
2. Si usas variables, DEBEN ser estrictamente secuenciales empezando por {{1}} (luego {{2}}, {{3}}, etc.).
3. Las variables NO pueden estar al principio ni al final exacto del mensaje.
4. No uses demasiadas variables ni permitas que una variable represente más de unas pocas palabras.
5. Evita dobles espacios o retornos de carro (saltos de línea) consecutivos innecesarios.
6. Cero tolerancia a contenido ofensivo, amenazas, o promoción de artículos prohibidos (drogas, armas).
7. Si la categoría es UTILITY, el mensaje NO DEBE contener ningún tipo de lenguaje promocional (ni "descuentos", ni "ofertas"). Debe ser meramente informativo.
8. Si la categoría es MARKETING, hazlo persuasivo y directo.
9. Usa emojis de manera natural pero no excesiva.
10. NO incluyas saludos genéricos introductorios en tu respuesta, devuelve ÚNICAMENTE el texto del mensaje que se enviará. NO envuelvas la respuesta en comillas.`,
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const totalTokens = result.response.usageMetadata?.totalTokenCount || 50; // Fallback to 50 if missing

    // Track usage for billing
    await trackGeminiUsage(companyId, totalTokens);

    return NextResponse.json({ text: responseText.trim(), tokensUsed: totalTokens });
  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
