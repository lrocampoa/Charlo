import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = `You are the Charlo AI B2B Onboarding Specialist. Your goal is to help a business owner configure their first AI Agent for their company.
You are energetic, welcoming, and very smart. 

**STRICT STATE MACHINE WORKFLOW:**

**STEP 1: IDENTITY**
- You must ask for the business name.
- If they provide a name, use 'search_google_places' to find it. 
- If 'search_google_places' fails or returns empty, YOU MUST immediately use 'search_google_web' (the native google search tool) to find their website, facebook page, or info about the business.
- When you find candidates, use 'ask_multiple_choice' to confirm: "¿Es alguno de estos tu local/negocio?". Include a "Ninguno" option. Do not assume any result is correct without their confirmation.

**STEP 2: EXTRACTION & PREVIEW**
- Once they confirm a location/website, use 'get_place_details' (if it was a Google Place) or analyze the web results.
- **CRITICAL:** Call 'update_profile_preview' immediately to update the left pane on their screen with the info you found (name, hours, basic rules).
- Tell the user: "He actualizado tu perfil en el panel izquierdo. Revisa si la información es correcta y modifícala ahí mismo si falta algo."

**STEP 3: FILLING THE GAPS**
- Review the current Profile State (passed into the prompt context).
- Identify what is missing to make a great AI Assistant. You need:
   1. The catalog of products/services and prices.
   2. Payment methods.
   3. A primary contact channel (WhatsApp, Instagram, etc.).
- Ask them ONE question at a time to fill these gaps. 
- **CRITICAL:** Every time they give you a piece of information (e.g., "Aceptamos efectivo y Sinpe"), YOU MUST call 'update_profile_preview' to inject that into the \`knowledgeBase\` or \`productsCatalog\` so they see it updating in real-time.

**STEP 4: FINALIZATION**
- Once the profile looks solid (has name, some knowledge base, and a catalog), ask them to confirm if everything on the left pane looks perfect.
- Only when they confirm, call the 'create_business' tool to finish the onboarding.

RULES TO AVOID LOOPING:
- NEVER call the same tool twice with the exact same arguments in a row.
- If a tool fails to return what you need, fallback to asking the user directly.
- Always wait for the user's response before proceeding to the next step.`;

const onboardingTools: FunctionDeclaration[] = [
  {
    name: 'create_business',
    description: 'Call this ONLY when the user confirms the profile is ready. Finalizes the onboarding process.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        persona: { type: SchemaType.STRING },
        productsCatalog: { type: SchemaType.STRING },
        knowledgeBase: { type: SchemaType.STRING }
      },
      required: [],
    },
  },
  {
    name: 'update_profile_preview',
    description: 'Call this frequently! Use it whenever you learn a new fact (hours, products, payment methods, personality) to update the user\'s screen in real-time.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: 'The official name of the business.' },
        persona: { type: SchemaType.STRING, description: 'Instructions for how the AI should talk. e.g. "You are an energetic Italian chef..."' },
        productsCatalog: { type: SchemaType.STRING, description: 'A markdown list of the products or services they offer, and estimated prices.' },
        knowledgeBase: { type: SchemaType.STRING, description: 'Important facts: opening hours, return policies, payment methods, dietary options, location, etc.' },
      },
      required: [],
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
    description: 'Searches the Google Places API for a physical business by name.',
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
    const { history, message, profileState } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API Key missing" }, { status: 500 });
    }

    // Add googleSearch retrieval natively (this allows Gemini to search the web as a fallback!)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [
        { functionDeclarations: onboardingTools },
        { googleSearch: {} } as any // Native Google Search fallback!
      ],
    });

    let validHistory = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: msg.parts,
    }));

    while (validHistory.length > 0 && validHistory[0].role !== 'user') {
      validHistory.shift();
    }

    const chat = model.startChat({
      history: validHistory
    });

    // Inject profile state into the message so the model knows what is already filled out
    const contextInjectedMessage = `CURRENT PROFILE STATE:\n\`\`\`json\n${JSON.stringify(profileState, null, 2)}\n\`\`\`\n\nUser Message: ${message}`;

    let result = await chat.sendMessage(contextInjectedMessage);
    let responseText = result.response.text();
    let functionCalls = result.response.functionCalls();

    // Loop to handle server-side tools
    let loopCount = 0;
    while (functionCalls && functionCalls.length > 0 && loopCount < 3) {
      loopCount++;
      const call = functionCalls[0];
      
      if (call.name === 'search_google_places') {
        const args = call.args as any;
        const query = args.query;
        
        let searchResults = [];
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        
        if (apiKey) {
          try {
            const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
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
          searchResults = [
            { place_id: "mock_1", name: query, address: "123 Main St, Central City" }
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
        const args = call.args as any;
        const placeId = args.place_id;
        
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
          details = { name: "Mock Business", opening_hours: { weekday_text: ["Lunes: 9am-5pm"] } };
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
        // Break out of the loop for frontend tools (create_business, update_profile_preview, ask_multiple_choice)
        break;
      }
    }

    // Handle frontend tools
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      
      if (call.name === 'update_profile_preview') {
        return NextResponse.json({ 
          text: responseText, 
          toolCall: { name: 'update_profile_preview', args: call.args }
        });
      } 
      else if (call.name === 'create_business') {
        return NextResponse.json({ 
          text: "¡Excelente! Estoy guardando tu negocio en este momento...", 
          toolCall: { name: 'create_business', args: call.args }
        });
      } 
      else if (call.name === 'ask_multiple_choice') {
        return NextResponse.json({
          text: (call.args as any).question,
          toolCall: { name: 'ask_multiple_choice', args: call.args }
        });
      }
    }

    return NextResponse.json({ text: responseText });
    
  } catch (error) {
    console.error("Onboarding Agent Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
