import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      "Extract all readable text, menus, pricing, facts, and rules from this document/image. Structure it logically and format it as clean markdown that is useful for a customer service AI. Try to deduce the business name as well and put it at the very top as '# Business Name: [Name]'. Do not invent any information.",
      { inlineData: { data: base64Data, mimeType } }
    ]);
    extractedText = result.response.text();

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: 'Could not extract text from the file.' }, { status: 400 });
    }

    let businessName = "Mi Negocio";
    const firstLineMatch = extractedText.match(/# Business Name:\s*(.*)/i);
    if (firstLineMatch && firstLineMatch[1]) {
      businessName = firstLineMatch[1].trim();
    }

    return NextResponse.json({ 
      success: true, 
      profileUpdate: {
        name: businessName,
        knowledgeBase: `Extraído de archivo ${file.name}:\n\n${extractedText}`
      }
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to upload and parse file' }, { status: 500 });
  }
}
