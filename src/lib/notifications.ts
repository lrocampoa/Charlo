export async function sendAdminAlert(subject: string, errorDetails: string) {
  const serverToken = process.env.POSTMARK_SERVER_TOKEN;
  const adminEmail = process.env.ADMIN_EMAIL;
  // Postmark requires the "From" email to be a verified Sender Signature in your account.
  const senderEmail = process.env.SENDER_EMAIL || adminEmail;

  if (!serverToken || !adminEmail || !senderEmail) {
    console.warn("⚠️ Postmark not configured (missing POSTMARK_SERVER_TOKEN, ADMIN_EMAIL, or SENDER_EMAIL). Alert skipped:", subject);
    return;
  }

  try {
    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": serverToken
      },
      body: JSON.stringify({
        From: senderEmail,
        To: adminEmail,
        Subject: `🚨 Charlo AI Alert: ${subject}`,
        TextBody: `Charlo System Alert\n\nEvent: ${subject}\n\nDetails:\n${errorDetails}\n\nTime: ${new Date().toISOString()}\n\nPlease check the server logs for more info.`,
      })
    });

    if (!res.ok) {
      console.error("❌ Failed to send Postmark alert. Status:", res.status, "Body:", await res.text());
    } else {
      console.log(`📧 Admin alert sent successfully to ${adminEmail}`);
    }
  } catch (error) {
    console.error("❌ Error sending alert via Postmark:", error);
  }
}

export async function sendOwnerEmailAlert(toEmail: string, subject: string, htmlBody: string) {
  const serverToken = process.env.POSTMARK_SERVER_TOKEN;
  const senderEmail = process.env.SENDER_EMAIL || process.env.ADMIN_EMAIL || "alerts@charlo.com";

  if (!serverToken) {
    console.warn("⚠️ Postmark not configured (missing POSTMARK_SERVER_TOKEN). Owner alert skipped:", subject);
    return;
  }

  try {
    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": serverToken
      },
      body: JSON.stringify({
        From: senderEmail,
        To: toEmail,
        Subject: `Charlo: ${subject}`,
        HtmlBody: htmlBody,
      })
    });

    if (!res.ok) {
      console.error("❌ Failed to send Postmark owner alert. Status:", res.status, "Body:", await res.text());
    } else {
      console.log(`📧 Owner alert sent successfully to ${toEmail}`);
    }
  } catch (error) {
    console.error("❌ Error sending owner alert via Postmark:", error);
  }
}
