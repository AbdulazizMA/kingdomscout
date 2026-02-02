import { Router } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any
});

const PRICE_IDS = {
  premium: process.env.STRIPE_PREMIUM_PRICE_ID || '',
  pro: process.env.STRIPE_PRO_PRICE_ID || ''
};

// Get subscription plans
router.get('/plans', asyncHandler(async (req, res) => {
  res.json({
    plans: [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        features: [
          'Top 3 deals per day',
          'Basic filters (city, type)',
          '24-hour delayed data',
          'Email newsletter'
        ]
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 29,
        currency: 'USD',
        priceSAR: 109,
        popular: true,
        features: [
          'Unlimited deal access',
          'Real-time updates (4 hours)',
          'Advanced filters & alerts',
          'Price history charts',
          'Save favorites',
          'Export to CSV',
          'Email support'
        ]
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 99,
        currency: 'USD',
        priceSAR: 372,
        features: [
          'Everything in Premium',
          'Instant alerts (Telegram/WhatsApp)',
          'API access',
          'Off-market deals',
          'Monthly strategy call',
          'Priority support',
          'Team accounts (5 users)'
        ]
      }
    ]
  });
}));

// Get current subscription
router.get('/current', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionStartedAt: true,
      subscriptionEndsAt: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true
    }
  });

  // Get Stripe subscription details if exists
  let stripeDetails = null;
  if (user?.stripeSubscriptionId) {
    try {
      stripeDetails = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    } catch (e) {
      // Subscription might not exist in Stripe
    }
  }

  res.json({
    subscription: user,
    stripeDetails: stripeDetails ? {
      status: stripeDetails.status,
      currentPeriodEnd: new Date(stripeDetails.current_period_end * 1000),
      cancelAtPeriodEnd: stripeDetails.cancel_at_period_end
    } : null
  });
}));

// Create checkout session
router.post('/checkout', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({
    tier: z.enum(['premium', 'pro']),
    successUrl: z.string().url(),
    cancelUrl: z.string().url()
  });

  const { tier, successUrl, cancelUrl } = schema.parse(req.body);
  const userId = req.user!.id;

  // Get or create Stripe customer
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true }
  });

  let customerId = user?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user!.email,
      metadata: { userId }
    });
    customerId = customer.id;

    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId }
    });
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: PRICE_IDS[tier],
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, tier }
  });

  res.json({ sessionId: session.id, url: session.url });
}));

// Create billing portal session
router.post('/portal', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({
    returnUrl: z.string().url()
  });

  const { returnUrl } = schema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { stripeCustomerId: true }
  });

  if (!user?.stripeCustomerId) {
    return res.status(400).json({ error: 'No subscription found' });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl
  });

  res.json({ url: session.url });
}));

// Cancel subscription
router.post('/cancel', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { stripeSubscriptionId: true }
  });

  if (!user?.stripeSubscriptionId) {
    return res.status(400).json({ error: 'No active subscription' });
  }

  // Cancel at period end
  await stripe.subscriptions.update(user.stripeSubscriptionId, {
    cancel_at_period_end: true
  });

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { subscriptionStatus: 'cancelled' }
  });

  res.json({ message: 'Subscription will cancel at period end' });
}));

// Resume subscription
router.post('/resume', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { stripeSubscriptionId: true }
  });

  if (!user?.stripeSubscriptionId) {
    return res.status(400).json({ error: 'No subscription found' });
  }

  await stripe.subscriptions.update(user.stripeSubscriptionId, {
    cancel_at_period_end: false
  });

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { subscriptionStatus: 'active' }
  });

  res.json({ message: 'Subscription resumed' });
}));

export { router as subscriptionRouter };
