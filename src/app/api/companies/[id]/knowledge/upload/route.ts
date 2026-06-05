import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';
import { saveDataSource } from '@/lib/firebase/dbUtils';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;
    
    // Verify company ownership
    const db = adminDb;
    if (!db) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });
    const companyRef = db.collection('companies').doc(companyId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists || companyDoc.data()?.ownerId !== userId) {
      return NextResponse.json({ error: 'Company not found or unauthorized' }, { status: 403 });
    }

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
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const result = await model.generateContent([
      "Extract all readable text, menus, pricing, facts, and rules from this document/image. Structure it logically and format it as clean markdown that is useful for a customer service AI. Do not invent any information.",
      { inlineData: { data: base64Data, mimeType } }
    ]);
    extractedText = result.response.text();

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: 'Could not extract text from the file.' }, { status: 400 });
    }

    // Save to DB
    const dataSource = await saveDataSource(companyId, {
      name: file.name,
      type: isPdf ? 'pdf' : 'image',
      extractedText: extractedText
    });

    return NextResponse.json({ success: true, source: dataSource });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to upload and parse file' }, { status: 500 });
  }
}
