import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { verifyIdToken } from '@/lib/firebase/admin';
import crypto from 'crypto';

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
      let fetchUrl = url.trim().replace(/,/g, '.');
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
      model: "gemini-3.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema as any,
      }
    });
    
    const prompt = `You are an AI data extractor. Extract and structure all relevant business facts, rules, menus, SOPs, pricing, and knowledge from the following raw text scraped from a URL. Separate the actual products/services from general business info.\n\nRAW TEXT:\n${rawText.slice(0, 30000)}`;
    
    const result = await model.generateContent(prompt);
    let data;
    try {
      data = JSON.parse(result.response.text());
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse AI output' }, { status: 500 });
    }

    const hash = crypto.createHash('sha256').update(rawText).digest('hex');

    return NextResponse.json({ 
      success: true, 
      profileUpdate: {
        name: data.businessName || "Mi Negocio",
        knowledgeBase: `Extraído del sitio web ${url}:\n\n${data.knowledgeBase}`
      },
      extractedProducts: data.products || [],
      hash: hash,
      docType: docType
    });
  } catch (error: any) {
    console.error("Scrape Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to scrape URL' }, { status: 500 });
  }
}
