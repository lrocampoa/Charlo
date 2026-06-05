import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { PAYMENT_VISION_PROMPT } from './prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Validates a SINPE Móvil receipt image using Gemini's multimodal capabilities.
 * @param mimeType e.g., 'image/jpeg' or 'image/png'
 * @param base64Data the base64 encoded image string (without the data:image/... prefix)
 */
export async function verifySinpeReceipt(mimeType: string, base64Data: string) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: PAYMENT_VISION_PROMPT 
  });

  const imagePart: Part = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType
    }
  };

  try {
    // We prompt the model with a standard command, plus the image.
    // The systemInstruction will enforce the JSON output format.
    const result = await model.generateContent(["Please analyze this image.", imagePart]);
    const responseText = result.response.text();
    
    // Parse JSON
    const jsonString = responseText.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to verify SINPE receipt:", error);
    return {
      isPaymentReceipt: false,
      confidence: 0,
      error: "Verification failed due to an error processing the image."
    };
  }
}
