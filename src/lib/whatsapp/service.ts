export async function sendAdminWhatsAppAlert(phoneNumber: string, gapDetails: any, companyConfig: any) {
  if (!companyConfig || !companyConfig.whatsappPhoneNumberId || !companyConfig.metaAccessToken) {
    console.warn("[WhatsApp] Missing company config for WhatsApp API. Skipping WhatsApp alert.");
    return;
  }

  const { whatsappPhoneNumberId, metaAccessToken } = companyConfig;
  
  // Format the phone number (remove +, spaces, etc if needed)
  const toPhone = phoneNumber.replace(/\\D/g, '');

  const textBody = `🚨 *Alerta: Brecha de Conocimiento Detectada* 🚨\n\nEl asistente de IA no pudo responder a una consulta.\n\n*Título:* ${gapDetails.missingSopTitle || gapDetails.question || 'Desconocido'}\n*Severidad:* ${gapDetails.severity || 'MEDIA'}\n*Descripción:* ${gapDetails.description || gapDetails.question || 'No especificada'}\n\nPor favor, ingresa al panel de control (Mejora Continua) para resolver esto.`;

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${whatsappPhoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${metaAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: textBody,
        }
      })
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`[WhatsApp] Admin alert sent to ${toPhone}`);
    } else {
      console.error("[WhatsApp] Failed to send admin alert:", data);
    }
  } catch (error) {
    console.error("[WhatsApp] Error sending admin alert:", error);
  }
}
