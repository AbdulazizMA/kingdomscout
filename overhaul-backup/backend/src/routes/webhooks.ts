import { Router } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Stripe webhook handler
router.post('/stripe', asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Webhook received:', event.type);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.metadata?.userId;
      const tier = session.metadata?.tier;

      if (userId && tier) {
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: tier,
            subscriptionStatus: 'active',
            subscriptionStartedAt: new Date(),
            subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
            stripeSubscriptionId: subscription.id
          }
        });

        console.log(`User ${userId} upgraded to ${tier}`);
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );

        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            subscriptionStatus: 'active',
            subscriptionEndsAt: new Date(subscription.current_period_end * 1000)
          }
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      
      if (invoice.subscription) {
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: invoice.subscription as string },
          data: { subscriptionStatus: 'past_due' }
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      await prisma.user.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          subscriptionTier: 'free',
          subscriptionStatus: 'inactive',
          stripeSubscriptionId: null
        }
      });

      console.log(`Subscription ${subscription.id} deleted, user downgraded to free`);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;

      await prisma.user.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          subscriptionStatus: subscription.status === 'active' ? 'active' : 'inactive',
          subscriptionEndsAt: new Date(subscription.current_period_end * 1000)
        }
      });
      break;
    }
  }

  res.json({ received: true });
}));

export { router as webhookRouter };
