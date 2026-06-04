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
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { companyId } = await req.json();
    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
    }

    const companyDoc = await adminDb.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    const company = companyDoc.data();
    if (company?.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const customerId = company?.stripeCustomerId;
    if (!customerId) {
      return NextResponse.json({ error: 'No Stripe customer found for this company.' }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe portal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
