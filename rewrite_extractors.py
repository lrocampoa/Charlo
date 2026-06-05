import sys

def rewrite_scrape_url():
    with open("src/app/api/onboarding/scrape-url/route.ts", "r") as f:
        content = f.read()

    schema_import = "import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';"
    content = content.replace("import { GoogleGenerativeAI } from '@google/generative-ai';", schema_import)

    old_gemini_block = """    // Clean up with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are an AI data extractor. Extract and structure all relevant business facts, rules, menus, SOPs, pricing, and knowledge from the following raw text scraped from a URL. Output ONLY clean markdown text that would be useful for a customer service AI. Try to deduce the business name as well and put it at the very top as '# Business Name: [Name]'. Do not invent any information.\\n\\nRAW TEXT:\\n${rawText.slice(0, 30000)}`;
    
    const result = await model.generateContent(prompt);
    const cleanedText = result.response.text();

    // Extract business name from the first line if possible
    let businessName = "Mi Negocio";
    const firstLineMatch = cleanedText.match(/# Business Name:\\s*(.*)/i);
    if (firstLineMatch && firstLineMatch[1]) {
      businessName = firstLineMatch[1].trim();
    }

    return NextResponse.json({ 
      success: true, 
      profileUpdate: {
        name: businessName,
        knowledgeBase: `Extraído del sitio web ${url}:\\n\\n${cleanedText}`
      }
    });"""

    new_gemini_block = """    // Clean up with Gemini
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
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });
    
    const prompt = `You are an AI data extractor. Extract and structure all relevant business facts, rules, menus, SOPs, pricing, and knowledge from the following raw text scraped from a URL. Separate the actual products/services from general business info.\\n\\nRAW TEXT:\\n${rawText.slice(0, 30000)}`;
    
    const result = await model.generateContent(prompt);
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
        knowledgeBase: `Extraído del sitio web ${url}:\\n\\n${data.knowledgeBase}`
      },
      extractedProducts: data.products || []
    });"""

    content = content.replace(old_gemini_block, new_gemini_block)

    with open("src/app/api/onboarding/scrape-url/route.ts", "w") as f:
        f.write(content)

def rewrite_upload_file():
    with open("src/app/api/onboarding/upload-file/route.ts", "r") as f:
        content = f.read()

    schema_import = "import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';"
    content = content.replace("import { GoogleGenerativeAI } from '@google/generative-ai';", schema_import)

    old_gemini_block = """    // Parse Document/Image with Gemini 1.5 Flash natively!
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
    const firstLineMatch = extractedText.match(/# Business Name:\\s*(.*)/i);
    if (firstLineMatch && firstLineMatch[1]) {
      businessName = firstLineMatch[1].trim();
    }

    return NextResponse.json({ 
      success: true, 
      profileUpdate: {
        name: businessName,
        knowledgeBase: `Extraído de archivo ${file.name}:\\n\\n${extractedText}`
      }
    });"""

    new_gemini_block = """    // Parse Document/Image with Gemini 1.5 Flash natively!
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
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
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
        knowledgeBase: `Extraído de archivo ${file.name}:\\n\\n${data.knowledgeBase}`
      },
      extractedProducts: data.products || []
    });"""

    content = content.replace(old_gemini_block, new_gemini_block)

    with open("src/app/api/onboarding/upload-file/route.ts", "w") as f:
        f.write(content)

rewrite_scrape_url()
rewrite_upload_file()
