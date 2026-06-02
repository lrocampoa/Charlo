# Admin Alerts Setup Steps

To ensure the new Admin Escalation Alerts (Email & WhatsApp) function correctly in production, the following setup steps must be completed:

## 1. Environment Variables Configuration
Add the following keys to your `.env.local` (and production environment settings):

```env
# Postmark integration
POSTMARK_SERVER_TOKEN=your_postmark_server_token
POSTMARK_FROM_EMAIL=alerts@yourdomain.com
```

## 2. Postmark Verification
- Create an account at [Postmark](https://postmarkapp.com).
- Verify the domain or specific sender email address you plan to use for `POSTMARK_FROM_EMAIL`.
- Generate the Server API Token and add it to your environment variables.

## 3. WhatsApp Owner Phone Configuration
To send WhatsApp alerts, the system looks up the business owner's phone number in this order:
1. `user.phoneNumber` directly from Firebase Auth.
2. `ownerPhone` custom field from the business's document in the `companies` Firestore collection.

**Action:** Ensure the admin's personal phone number is populated in one of these locations (in international format, e.g., `5215512345678`).

## 4. Meta / WhatsApp 24-Hour Policy (IMPORTANT)
The WhatsApp alert utilizes the standard Meta Cloud API `/messages` endpoint. 
- **Free-form messaging:** By default, it sends a free-form message. This will ONLY be delivered if the owner has sent a message to the bot within the last 24 hours.
- **Out-of-window delivery:** If you need these alerts to reach the owner at any time (even if they haven't interacted with the bot recently), you MUST create an approved WhatsApp Utility Template in your Meta Business account and update the `src/lib/whatsapp/service.ts` logic to use `{ type: "template", template: { ... } }` instead of `{ type: "text" }`.
