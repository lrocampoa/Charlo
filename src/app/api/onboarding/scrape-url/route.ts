import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyIdToken } from '@/lib/firebase/admin';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await request.json();

    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

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
      let fetchUrl = url;
      if (!fetchUrl.startsWith('http')) fetchUrl = `https://${fetchUrl}`;
      
      const response = await fetch(fetchUrl, {
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are an AI data extractor. Extract and structure all relevant business facts, rules, menus, SOPs, pricing, and knowledge from the following raw text scraped from a URL. Output ONLY clean markdown text that would be useful for a customer service AI. Try to deduce the business name as well and put it at the very top as '# Business Name: [Name]'. Do not invent any information.\n\nRAW TEXT:\n${rawText.slice(0, 30000)}`;
    
    const result = await model.generateContent(prompt);
    const cleanedText = result.response.text();

    // Extract business name from the first line if possible
    let businessName = "Mi Negocio";
    const firstLineMatch = cleanedText.match(/# Business Name:\s*(.*)/i);
    if (firstLineMatch && firstLineMatch[1]) {
      businessName = firstLineMatch[1].trim();
    }

    return NextResponse.json({ 
      success: true, 
      profileUpdate: {
        name: businessName,
        knowledgeBase: `Extraído del sitio web ${url}:\n\n${cleanedText}`
      }
    });
  } catch (error: any) {
    console.error("Scrape Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to scrape URL' }, { status: 500 });
  }
}
