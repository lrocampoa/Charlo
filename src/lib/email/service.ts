import * as postmark from 'postmark';

const serverToken = process.env.POSTMARK_SERVER_TOKEN || '';
const client = serverToken ? new postmark.ServerClient(serverToken) : null;

export async function sendAdminKnowledgeGapAlert(email: string, gapDetails: any) {
  if (!client) {
    console.warn("POSTMARK_SERVER_TOKEN is missing. Skipping email alert.");
    return;
  }

  const fromEmail = process.env.POSTMARK_FROM_EMAIL || 'alerts@yourdomain.com';

  const htmlBody = `
    <h2>Nueva Brecha de Conocimiento (Knowledge Gap) Detectada</h2>
    <p>El asistente de IA no pudo responder a una consulta debido a falta de información en su configuración.</p>
    <ul>
      <li><strong>Título:</strong> ${gapDetails.missingSopTitle || gapDetails.question || 'Desconocido'}</li>
      <li><strong>Descripción:</strong> ${gapDetails.description || gapDetails.question || 'No especificada'}</li>
      <li><strong>Severidad:</strong> ${gapDetails.severity || 'MEDIA'}</li>
    </ul>
    <p>Por favor, ingrese al panel de control (Mejora Continua) para resolver esta brecha y actualizar el cerebro de la IA.</p>
  `;

  try {
    await client.sendEmail({
      From: fromEmail,
      To: email,
      Subject: `Alerta: Brecha de conocimiento detectada - ${gapDetails.missingSopTitle || 'Nueva'}`,
      HtmlBody: htmlBody,
      TextBody: htmlBody.replace(/<[^>]+>/g, ''), // Fallback
    });
    console.log(`[Email] Admin alert sent to ${email}`);
  } catch (error) {
    console.error("[Email] Failed to send admin alert:", error);
  }
}
