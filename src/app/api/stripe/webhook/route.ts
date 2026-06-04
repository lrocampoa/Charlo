import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase/admin';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
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
          const companyId = session.metadata?.companyId;
          const tier = session.metadata?.tier;
          
          if (companyId && tier) {
            await adminDb.collection('companies').doc(companyId).update({
              'subscription.tier': tier,
              'subscription.status': subscription.status,
              'subscription.currentPeriodEnd': subscription.current_period_end * 1000,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: session.customer as string
            });
            console.log(`Successfully upgraded company ${companyId} to tier ${tier}`);
          }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const companyId = subscription.metadata?.companyId;
        const tier = subscription.metadata?.tier;
        
        if (companyId) {
          const updateData: any = {
            'subscription.status': subscription.status,
            'subscription.currentPeriodEnd': subscription.current_period_end * 1000
          };
          if (tier) {
            updateData['subscription.tier'] = tier;
          }
          await adminDb.collection('companies').doc(companyId).update(updateData);
          console.log(`Updated subscription for company ${companyId}. Status: ${subscription.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const companyId = subscription.metadata?.companyId;
        
        if (companyId) {
          await adminDb.collection('companies').doc(companyId).update({
            'subscription.tier': 'starter', // Or 'free' if we have one
            'subscription.status': 'canceled',
            stripeSubscriptionId: null
          });
          console.log(`Subscription canceled for company ${companyId}. Reverted to starter tier.`);
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
