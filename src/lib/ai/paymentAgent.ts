import { GoogleGenerativeAI } from '@google/generative-ai';
import { registerPayment, getCustomerProfile, getCompanyConfig } from '../firebase/dbUtils';
import { dispatchUberFlash } from '../services/uberFlash';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function handlePaymentImage(
  companyId: string,
  customerId: string,
  imagePart: { data: string, mimeType: string }
) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.5-flash',
      systemInstruction: "Eres un analista financiero experto. Analiza la imagen. Si es un comprobante de transferencia bancaria o SINPE Móvil, extrae los siguientes datos exactos. Responde estrictamente en formato JSON válido: { \"esComprobante\": true, \"monto\": 15000, \"referencia\": \"123456789\", \"nombreRemitente\": \"Juan Perez\", \"fecha\": \"2024-05-15 14:30\", \"telefonoDestino\": \"88888888\" }. Si algún dato no aparece, ponlo como null. Si NO es un comprobante de pago, responde { \"esComprobante\": false }."
    });

    const result = await model.generateContent([
      "Analiza esta imagen y extrae los datos del pago en JSON.",
      {
        inlineData: {
          data: imagePart.data,
          mimeType: imagePart.mimeType
        }
      }
    ]);

    const text = result.response.text();
    // Use regex to safely extract the JSON from markdown if Gemini wraps it
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return "No logré leer el comprobante. ¿Podrías enviarlo de nuevo con más claridad?";
    }

    const data = JSON.parse(jsonMatch[0]);

    if (data.esComprobante && typeof data.monto === 'number' && data.monto > 0 && data.monto < 10000000) {
      // Sanitize inputs
      const safeAmount = data.monto;
      const safeRef = String(data.referencia || 'N/A').slice(0, 100);
      const safeSender = String(data.nombreRemitente || 'N/A').slice(0, 100);
      const safePhone = String(data.telefonoDestino || 'N/A').slice(0, 20);

      // Register the payment in the DB!
      await registerPayment(companyId, customerId, {
        amount: safeAmount,
        reference: safeRef,
        senderName: safeSender,
        receiptDate: data.fecha || new Date().toISOString(),
        destinationPhone: safePhone,
        method: 'SINPE Móvil',
        status: 'pending_verification' // AI extracted payments require human verification
      });
      
      let baseResponse = `¡Excelente! He registrado tu comprobante de SINPE Móvil por ₡${safeAmount} a nombre de ${safeSender} (Ref: ${safeRef}). En breve verificaremos el pago.`;
      
      // Dispatch Uber Flash
      try {
        const company = await getCompanyConfig(companyId);
        const crmProfile = await getCustomerProfile(companyId, customerId);
        const crmFacts = crmProfile?.extractedFacts || {};
        
        // Find best address
        let deliveryAddress = crmFacts.address_home || crmFacts.address_work || crmFacts.address_other || crmFacts.location;
        
        if (deliveryAddress && company?.deliveryConfig?.uberEnabled) {
          const dispatchRes = await dispatchUberFlash(companyId, deliveryAddress, company.deliveryConfig);
          if (dispatchRes.success) {
             baseResponse += `\n\n🚗 **Uber Flash Solicitado**\nTu orden está confirmada y hemos enviado un Uber Flash a recogerla. Va en camino hacia: ${deliveryAddress}. Tiempo estimado: ${dispatchRes.estimatedDeliveryTime}.\nSigue tu paquete aquí: ${dispatchRes.trackingLink}`;
          }
        } else if (company?.deliveryConfig?.uberEnabled) {
           baseResponse += `\n\nNo tengo guardada tu ubicación exacta para el envío por Uber Flash. Por favor dímela para coordinar la entrega.`;
        }
      } catch (e) {
        console.error("Error dispatching Uber Flash:", e);
      }

      return baseResponse;
    } else {
      return "Recibí la imagen, pero no parece ser un comprobante de pago válido. Si tienes dudas, dime cómo puedo ayudarte.";
    }

  } catch (error) {
    console.error("Error analyzing payment image:", error);
    return "Recibí tu imagen, pero hubo un problema al procesarla. Por favor, espera a que un humano te asista.";
  }
}
