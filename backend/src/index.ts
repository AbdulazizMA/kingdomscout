import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { execSync } from 'child_process';

import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { propertiesRouter } from './routes/properties';
import { userRouter } from './routes/user';
import { adminRouter } from './routes/admin';
import { subscriptionRouter } from './routes/subscription';
import { webhookRouter } from './routes/webhooks';
import { imagesRouter } from './routes/images';
import { prisma } from './lib/prisma';

dotenv.config();

// Env validation
if (process.env.NODE_ENV === 'production') {
  const required = ['DATABASE_URL'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`FATAL: Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change')) {
    console.warn('WARNING: JWT_SECRET is not properly configured for production');
  }
}

// Database schema sync at startup
async function initDatabase() {
  if (process.env.NODE_ENV === 'production') {
    console.log('Syncing database schema...');
    try {
      execSync('npx prisma db push --skip-generate', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        timeout: 30000,
      });
      console.log('Database schema synced');
    } catch (error) {
      console.warn('Schema sync failed - tables may already exist, continuing...');
    }
  }
}

initDatabase().catch(console.error);

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.endsWith('.fly.dev')) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (origin.endsWith('.netlify.app')) return callback(null, true);
    if (allowedOrigins.some(o => origin === o)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path === '/health',
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'Too many authentication attempts.' },
});

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const propertyCount = await prisma.property.count().catch(() => 0);
    const cityCount = await prisma.city.count().catch(() => 0);

    res.json({
      status: 'ok',
      database: 'connected',
      properties: propertyCount,
      cities: cityCount,
      version: '3.0',
      sources: ['aqar.fm', 'bayut.sa', 'haraj.com.sa'],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// Static files
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// API Routes
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/images', imagesRouter);
app.use('/webhooks', webhookRouter);

// API docs
app.get('/api', (req, res) => {
  res.json({
    name: 'KingdomScout API',
    version: '3.0.0',
    sources: ['aqar.fm', 'bayut.sa', 'haraj.com.sa'],
    endpoints: {
      auth: '/api/auth',
      properties: '/api/properties',
      user: '/api/user',
      admin: '/api/admin',
      health: '/health',
    },
  });
});

// Error handling
app.use(errorHandler);

// 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
