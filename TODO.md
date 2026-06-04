# Charlo - Master TODO & Setup Guide

## 1. Setup & Configuration (Action Required for Production)

### Admin Email Alerts (Postmark)
*Status: [ ] Pending Setup*
To ensure Email Escalation Alerts function correctly:
- Create an account at [Postmark](https://postmarkapp.com).
- Verify the domain or specific sender email address you plan to use for `POSTMARK_FROM_EMAIL`.
- Add the following to your `.env.local`:
  ```env
  POSTMARK_SERVER_TOKEN=your_postmark_server_token
  POSTMARK_FROM_EMAIL=alerts@yourdomain.com
  ```

### WhatsApp Owner Alerts
*Status: [x] Completed / Setup Required*
The backend now correctly dispatches WhatsApp alerts to the owner for Granular Usage Warnings (85%, 90%, 95%, 100%) and Human Escalations.
**Action:** The system sends these alerts to the `testPhoneNumber` saved in the business profile. Make sure owners populate the "WhatsApp Test Number" in the dashboard.

### Meta / WhatsApp 24-Hour Policy (IMPORTANT)
*Status: [ ] Pending Template Approval*
The WhatsApp alerts currently send free-form messages to the owner. This will ONLY be delivered if the owner has sent a message to the bot within the last 24 hours.
**Action:** If you need these alerts to reach the owner at any time, you MUST create an approved WhatsApp Utility Template in your Meta Business account and update the alert logic to use `{ type: "template", template: { ... } }` instead of `{ type: "text" }`.

### Uber Flash Setup (Automated Deliveries)
*Status: [ ] Pending API Keys*
The logic for automatically dispatching an Uber Flash upon payment extraction is in `src/lib/ai/paymentAgent.ts` and `src/lib/services/uberFlash.ts`.
**Action:** 
1. Generate OAuth 2.0 Credentials at the **Uber Direct Console**.
2. Add `UBER_CLIENT_ID` and `UBER_CLIENT_SECRET` to `.env.local`.
3. Set up a Webhook in the Uber console pointing to `https://your-domain.com/api/uber/webhook`.

---

## 2. Bucket List (Future Enhancements)

- [ ] **Real Social Media Scraping**: Replace the generative simulated scraping in the Onboarding flow with a real headless browser pipeline (e.g. Puppeteer/Playwright or specialized APIs) to accurately pull Menus, Bios, and Posts directly from Instagram, Facebook, and Google Business links.
- [ ] **Meta Connection Troubleshooting Guide**: Create documentation for users explaining how to troubleshoot Meta connection issues (e.g., missing WABA IDs, missing phone numbers, assigning correct permissions in Business Manager).
- [x] **Email Verification Enforcement**: Force users who sign up via Email/Password to verify their email before accessing the dashboard. *(Completed)*
- [x] **Granular Usage Alerts**: Send WhatsApp warnings to the owner when the AI consumes 85%, 90%, 95%, and 100% of the tier limit. *(Completed)*
- [x] **Dashboard Billing Wall**: Lock users out of the main app if their subscription is delinquent. *(Completed)*
