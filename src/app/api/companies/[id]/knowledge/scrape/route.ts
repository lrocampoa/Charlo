import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';
import { saveDataSource } from '@/lib/firebase/dbUtils';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;
    const { url } = await request.json();

    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    // Verify company ownership
    const db = adminDb;
    if (!db) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });
    const companyRef = db.collection('companies').doc(companyId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists || companyDoc.data()?.ownerId !== userId) {
      return NextResponse.json({ error: 'Company not found or unauthorized' }, { status: 403 });
    }

    let rawText = '';
    let docType = 'website';

    // Handle Google Docs
    if (url.includes('docs.google.com/document/d/')) {
      docType = 'google_doc';
      const docId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (!docId) return NextResponse.json({ error: 'Invalid Google Doc URL' }, { status: 400 });
      const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
      const response = await fetch(exportUrl);
      if (!response.ok) return NextResponse.json({ error: 'Failed to access Google Doc. Ensure it is publicly shared.' }, { status: 400 });
      rawText = await response.text();
    } 
    // Handle Google Sheets
    else if (url.includes('docs.google.com/spreadsheets/d/')) {
      docType = 'google_sheet';
      const sheetId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (!sheetId) return NextResponse.json({ error: 'Invalid Google Sheet URL' }, { status: 400 });
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      const response = await fetch(exportUrl);
      if (!response.ok) return NextResponse.json({ error: 'Failed to access Google Sheet. Ensure it is publicly shared.' }, { status: 400 });
      rawText = await response.text();
    }
    // Handle standard websites
    else {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!response.ok) return NextResponse.json({ error: 'Failed to fetch website' }, { status: 400 });
      const html = await response.text();
      const $ = cheerio.load(html);
      // Remove scripts and styles
      $('script, style, noscript, iframe').remove();
      rawText = $('body').text().replace(/\s+/g, ' ').trim();
    }

    if (!rawText || rawText.length < 10) {
      return NextResponse.json({ error: 'Could not extract meaningful text from this URL' }, { status: 400 });
    }

    // Clean up with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `You are an AI data extractor. Extract and structure all relevant business facts, rules, menus, SOPs, and knowledge from the following raw text scraped from a URL. Output ONLY clean markdown text that would be useful for a customer service AI. Do not invent any information.\n\nRAW TEXT:\n${rawText.slice(0, 30000)}`; // limit size
    
    const result = await model.generateContent(prompt);
    const cleanedText = result.response.text();

    // Save to DB
    let name = url;
    try {
      const parsedUrl = new URL(url);
      name = parsedUrl.hostname + parsedUrl.pathname;
    } catch (e) {}

    const hash = crypto.createHash('sha256').update(rawText).digest('hex');

    const dataSource = await saveDataSource(companyId, {
      name: name,
      type: docType,
      extractedText: cleanedText,
      contentHash: hash
    });

    return NextResponse.json({ success: true, source: dataSource });
  } catch (error: any) {
    console.error("Scrape Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to scrape URL' }, { status: 500 });
  }
}
