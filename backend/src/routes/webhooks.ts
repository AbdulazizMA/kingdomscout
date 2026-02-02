import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Stripe webhook handler - DISABLED (FREE VERSION)
router.post('/stripe', asyncHandler(async (req: Request, res: Response) => {
  // KingdomScout is now free - webhooks disabled
  res.json({ received: true, message: 'Subscriptions disabled - KingdomScout is free' });
}));

export { router as webhookRouter };
