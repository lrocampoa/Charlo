import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase/admin';
import Stripe from 'stripe';

async function enforceBusinessLimitsAndPause(userId: string, tier: string) {
  if (!adminDb) return;
  const maxBusinesses = { 'free': 1, 'starter': 2, 'growth': 5, 'pro': 10 }[tier as 'free'|'starter'|'growth'|'pro'] || 1;
  const snapshot = await adminDb.collection('companies').where('ownerId', '==', userId).orderBy('createdAt', 'asc').get();
  
  let activeCount = 0;
  for (const doc of snapshot.docs) {
    const c = doc.data();
    if (activeCount < maxBusinesses) {
      if (!c.isPaused) {
        activeCount++;
      }
    } else {
      if (!c.isPaused) {
        await adminDb.collection('companies').doc(doc.id).update({ isPaused: true });
      }
    }
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured in environment variables');
    return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
  }

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Retrieve subscription details
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const userId = session.metadata?.userId;
          const tier = session.metadata?.tier;
          
          if (userId && tier) {
            if (!adminDb) throw new Error('adminDb not initialized');
            await adminDb.collection('users').doc(userId).update({
              'subscription.tier': tier,
              'subscription.status': subscription.status,
              'subscription.currentPeriodEnd': (subscription as any).current_period_end * 1000,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: session.customer as string
            });
            console.log(`Successfully upgraded user ${userId} to tier ${tier}`);
          }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const tier = subscription.metadata?.tier;
        
        if (userId) {
          if (!adminDb) throw new Error('adminDb not initialized');
          const updateData: any = {
            'subscription.status': subscription.status,
            'subscription.currentPeriodEnd': (subscription as any).current_period_end * 1000
          };
          if (tier) {
            updateData['subscription.tier'] = tier;
            await enforceBusinessLimitsAndPause(userId, tier);
          }
          await adminDb.collection('users').doc(userId).update(updateData);
          console.log(`Updated subscription for user ${userId}. Status: ${subscription.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        
        if (userId) {
          if (!adminDb) throw new Error('adminDb not initialized');
          await adminDb.collection('users').doc(userId).update({
            'subscription.tier': 'free', 
            'subscription.status': 'canceled',
            stripeSubscriptionId: null
          });
          await enforceBusinessLimitsAndPause(userId, 'free');
          console.log(`Subscription canceled for user ${userId}. Reverted to free tier.`);
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
