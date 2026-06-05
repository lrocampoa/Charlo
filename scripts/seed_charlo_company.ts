import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { adminDb } from '../src/lib/firebase/admin';

async function seedCharlo() {
  console.log("Seeding Charlo Official Company...");

  // The ID we will use for the widget
  const companyId = "company_charlo_official";

  const companyRef = adminDb.collection('companies').doc(companyId);
  const doc = await companyRef.get();

  if (doc.exists) {
    console.log("Charlo company already exists!");
    return;
  }

  await companyRef.set({
    id: companyId,
    name: "Charlo",
    businessType: "Software Platform",
    knowledgeBase: "Charlo is a B2B AI Assistants Platform. It allows businesses to create AI agents that answer customer queries via WhatsApp and Web. Features include Calendar Booking, Payment Links via Stripe, and an Inbox for human escalation.",
    persona: "Helpful, professional, and concise. You are the official support agent for Charlo.",
    ownerId: "super_admin", // Can be updated later with the actual admin's ID
    teamMembers: [],
    subscription: { tier: 'enterprise', currentPeriodEnd: Date.now() + 365 * 24 * 60 * 60 * 1000 },
    usage: { aiMessagesCurrentMonth: 0 },
    createdAt: new Date().toISOString(),
    isCharloInternal: true
  });

  console.log("Charlo company created successfully!");
}

seedCharlo().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
