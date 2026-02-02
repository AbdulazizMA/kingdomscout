import { Router, Request, Response } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any
});

// Get subscription plan - DISABLED (FREE VERSION)
router.get('/plan', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    plan: {
      id: 'free',
      name: 'مجاني',
      price: 0,
      currency: 'USD',
      priceSAR: 0,
      features: [
        'وصول غير محدود للعقارات',
        'تنبيهات فورية (بريد + تلغرام)',
        'حفظ العقارات المفضلة',
        'رسم بياني لتاريخ الأسعار',
        'فلاتر متقدمة (المدينة، النوع، السعر، المساحة)',
        'إشعارات بالعقارات الجديدة'
      ]
    }
  });
}));

// Get current subscription status - DISABLED (FREE VERSION)
router.get('/current', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    subscription: {
      subscriptionStatus: 'active',
      subscriptionStartedAt: new Date(),
      subscriptionEndsAt: null
    },
    stripeDetails: null
  });
}));

// Create checkout session - DISABLED (FREE VERSION)
router.post('/checkout', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  res.status(400).json({ error: 'Subscriptions are disabled - KingdomScout is now free!' });
}));

// Create billing portal session - DISABLED (FREE VERSION)
router.post('/portal', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  res.status(400).json({ error: 'Subscriptions are disabled - KingdomScout is now free!' });
}));

// Cancel subscription - DISABLED (FREE VERSION)
router.post('/cancel', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  res.status(400).json({ error: 'Subscriptions are disabled - KingdomScout is now free!' });
}));

// Resume subscription - DISABLED (FREE VERSION)
router.post('/resume', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  res.status(400).json({ error: 'Subscriptions are disabled - KingdomScout is now free!' });
}));

export { router as subscriptionRouter };
