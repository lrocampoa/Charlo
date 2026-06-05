import { GoogleGenerativeAI } from '@google/generative-ai';
import { SALES_PROMPT } from './prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function handleSalesQuery(
  userInput: string, 
  history: any[],
  productsCatalog: string,
  crmFacts: any = {},
  productsList: any[] = []
) {
  // Format the structured products database into a readable list for the AI
  let structuredProductsStr = "";
  if (productsList && productsList.length > 0) {
    structuredProductsStr = productsList.map(p => 
      `- **${p.name}**: ${p.price > 0 ? `${p.price} ${p.currency || ''}` : 'Precio a consultar'}\n  ${p.description || ''}`
    ).join('\n\n');
  }

  const combinedCatalog = [
    productsCatalog,
    structuredProductsStr ? `\n\n### Catálogo de Productos Estructurados:\n${structuredProductsStr}` : ''
  ].filter(Boolean).join('\n');

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-latest',
    systemInstruction: `${SALES_PROMPT}\n\nProducts Available:\n${combinedCatalog}\n\nPERMANENT CRM FACTS ABOUT THIS USER:\n${JSON.stringify(crmFacts, null, 2)}`
  });

  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userInput);
    return result.response.text();
  } catch (error) {
    console.error("Error in Sales Agent:", error);
    return "Lo siento, no pude procesar tu solicitud de compra.";
  }
}
