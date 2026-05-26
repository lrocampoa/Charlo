import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = `You are the Charlo AI B2B Onboarding Specialist. Your goal is to help a business owner configure their first AI Agent for their company.
You are energetic, welcoming, and very smart.

Follow these steps EXACTLY:
1. Greet the user warmly and ask them for the name of their business.
2. If the user provides a business name, YOU MUST IMMEDIATELY use the 'search_google_places' tool to find their real business. Do not ask for their address yet, just search the name they gave you.
3. After 'search_google_places' returns results, you MUST use the 'ask_multiple_choice' tool to ask them "¿Es alguno de estos tu local?" and list the precise addresses/names exactly as they were returned, plus a "Ninguno" option.
4. When the user replies with their selected address, YOU MUST IMMEDIATELY use 'search_google_places' again with that exact address string to reliably find its place_id, and then use 'get_place_details' to extract their official hours, website, etc.
5. After extracting the details, summarize the information you found (e.g. "¡Perfecto! Encontré que tu horario es de 9 a 5, y tu teléfono es X...").
6. CRITICAL NEXT STEP: You MUST inform the user that to configure their assistant properly, you need a bit more information. Ask them sequentially for:
   - Their WhatsApp number, Instagram link, or Facebook link (CRITICAL: without at least one channel, the assistant cannot be installed).
   - A link to their menu or a list of their services.
   - What payment methods they accept (cash, Sinpe Móvil, credit cards).
   - If they have specific dietary options (if they are a restaurant).
7. If the user says they don't have something, acknowledge it and move on to the next question. Do not force them if they explicitly decline.
8. Once you have gathered the required information (channels, menu/services, payment methods) or the user has confirmed they don't have them, YOU MUST CALL THE 'create_business' TOOL.
9. In the 'create_business' tool, intelligently fill out 'persona', 'productsCatalog', 'knowledgeBase' (incorporating payment methods and dietary info), 'whatsappNumber', 'instagramLink', 'facebookLink'. If they lack a website or use a social media link as their main website, set 'needsWebsiteUpsell' to true.
10. After successfully calling the 'create_business' tool, congratulate them enthusiastically and tell them they will be redirected to the dashboard automatically.

CRITICAL: When you need the user to choose a location, use the 'ask_multiple_choice' tool to render clickable buttons on their screen. Keep your conversational responses short.`;

const onboardingTools: FunctionDeclaration[] = [
  {
    name: 'create_business',
    description: 'Creates a new business tenant configuration in the database. Call this ONLY when you have gathered the business name and at least some context about what they do.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: 'The official name of the business.' },
        persona: { type: SchemaType.STRING, description: 'Instructions for how the AI should talk. e.g. "You are an energetic Italian chef..."' },
        productsCatalog: { type: SchemaType.STRING, description: 'A markdown list of the products or services they offer, and estimated prices. Include links if they provided any.' },
        knowledgeBase: { type: SchemaType.STRING, description: 'Important facts: opening hours, return policies, payment methods, dietary options, location, etc.' },
        whatsappNumber: { type: SchemaType.STRING, description: 'The WhatsApp number of the business, if provided.' },
        instagramLink: { type: SchemaType.STRING, description: 'The Instagram link of the business, if provided.' },
        facebookLink: { type: SchemaType.STRING, description: 'The Facebook link of the business, if provided.' },
        needsWebsiteUpsell: { type: SchemaType.BOOLEAN, description: 'Set to true ONLY IF the user lacks a custom website or uses a social media page (like Facebook) as their main website.' }
      },
      required: ['name', 'persona', 'productsCatalog', 'knowledgeBase'],
    },
  },
  {
    name: 'ask_multiple_choice',
    description: 'Use this tool to ask the user a multiple choice question. This will render buttons on their screen.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        question: { type: SchemaType.STRING, description: 'The text of the question.' },
        options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'A list of options to render as clickable buttons.' }
      },
      required: ['question', 'options'],
    },
  },
  {
    name: 'search_google_places',
    description: 'Searches the Google Places API for a business by name.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: 'The name of the business to search for.' }
      },
      required: ['query'],
    },
  },
  {
    name: 'get_place_details',
    description: 'Fetches detailed information about a specific Google Place (hours, website, phone).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        place_id: { type: SchemaType.STRING, description: 'The place_id returned by search_google_places.' }
      },
      required: ['place_id'],
    },
  }
];

export async function POST(request: Request) {
  try {
    const { history, message } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API Key missing" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: onboardingTools }],
    });

    let validHistory = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: msg.parts,
    }));

    // Gemini requires the history array to start with a 'user' message
    while (validHistory.length > 0 && validHistory[0].role !== 'user') {
      validHistory.shift();
    }

    const chat = model.startChat({
      history: validHistory
    });

    let result = await chat.sendMessage(message);
    let responseText = result.response.text();
    let functionCalls = result.response.functionCalls();

    // Intercept and execute server-side tools (Google Places API mock)
    while (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      
      if (call.name === 'search_google_places') {
        const query = call.args.query;
        console.log(`[Server] Executing search_google_places for: ${query}`);
        
        let searchResults = [];
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        
        if (apiKey) {
          try {
            const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`);
            const data = await res.json();
            if (data.results) {
              searchResults = data.results.slice(0, 3).map((place: any) => ({
                place_id: place.place_id,
                name: place.name,
                address: place.formatted_address
              }));
            }
          } catch (e) {
            console.error("Google Places Search Error:", e);
          }
        } else {
          // MOCK fallback
          searchResults = [
            { place_id: "mock_1", name: query, address: "123 Main St, Central City" },
            { place_id: "mock_2", name: query + " Express", address: "456 Side Ave, Central City" }
          ];
        }
        
        result = await chat.sendMessage([{
          functionResponse: {
            name: 'search_google_places',
            response: { results: searchResults }
          }
        }]);
        responseText = result.response.text();
        functionCalls = result.response.functionCalls();
      } 
      else if (call.name === 'get_place_details') {
        const placeId = call.args.place_id;
        console.log(`[Server] Executing get_place_details for: ${placeId}`);
        
        let details = {};
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        
        if (apiKey && !placeId.startsWith("mock_")) {
          try {
            const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,rating&key=${apiKey}`);
            const data = await res.json();
            if (data.result) {
              details = {
                name: data.result.name,
                formatted_address: data.result.formatted_address,
                formatted_phone_number: data.result.formatted_phone_number,
                website: data.result.website,
                opening_hours: data.result.opening_hours?.weekday_text || [],
                rating: data.result.rating
              };
            }
          } catch (e) {
            console.error("Google Places Details Error:", e);
          }
        } else {
          // MOCK fallback
          details = {
            name: "Business Details Data",
            formatted_address: "123 Main St, Central City",
            formatted_phone_number: "+1 555-1234",
            website: "https://mock.com",
            opening_hours: { weekday_text: ["Lunes: 9am-5pm", "Martes: 9am-5pm", "Miércoles: 9am-5pm", "Jueves: 9am-5pm", "Viernes: 9am-5pm"] },
            rating: 4.8
          };
        }
        
        result = await chat.sendMessage([{
          functionResponse: {
            name: 'get_place_details',
            response: details
          }
        }]);
        responseText = result.response.text();
        functionCalls = result.response.functionCalls();
      }
      else {
        // It's a frontend tool (create_business or ask_multiple_choice)
        break;
      }
    }

    // Handle frontend tools
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === 'create_business') {
        const businessArgs = call.args;
        
        return NextResponse.json({ 
          text: "¡Excelente! Estoy configurando tu negocio en este momento...", 
          toolCall: {
            name: 'create_business',
            args: businessArgs
          }
        });
      } else if (call.name === 'ask_multiple_choice') {
        const choiceArgs = call.args;
        return NextResponse.json({
          text: choiceArgs.question,
          toolCall: {
            name: 'ask_multiple_choice',
            args: choiceArgs
          }
        });
      }
    }

    return NextResponse.json({ text: responseText });
    
  } catch (error) {
    console.error("Onboarding Agent Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
