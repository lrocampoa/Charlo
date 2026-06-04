import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: "Firebase admin not initialized" }, { status: 500 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { companyId, tier } = await req.json();
    if (!companyId || !tier) {
      return NextResponse.json({ error: 'Missing companyId or tier' }, { status: 400 });
    }

    const companyDoc = await adminDb.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    const company = companyDoc.data();
    if (company?.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let priceId = '';
    if (tier === 'starter') priceId = process.env.STRIPE_PRICE_ID_STARTER || '';
    if (tier === 'growth') priceId = process.env.STRIPE_PRICE_ID_GROWTH || '';
    if (tier === 'pro') priceId = process.env.STRIPE_PRICE_ID_PRO || '';
    
    if (!priceId) {
      return NextResponse.json({ error: `Price ID not configured for tier: ${tier}` }, { status: 500 });
    }

    let customerId = company?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: decodedToken.email,
        metadata: {
          companyId,
          userId
        }
      });
      customerId = customer.id;
      await adminDb.collection('companies').doc(companyId).update({ stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?checkout=canceled`,
      metadata: {
        companyId,
        tier
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          companyId,
          tier
        }
      }
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
