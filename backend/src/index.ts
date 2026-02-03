import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
// import rateLimit from 'express-rate-limit';
import path from 'path';

import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { propertiesRouter } from './routes/properties';
import { userRouter } from './routes/user';
import { adminRouter } from './routes/admin';
import { subscriptionRouter } from './routes/subscription';
import { webhookRouter } from './routes/webhooks';
import { prisma } from './lib/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting - disabled for free tier (shared IPs cause issues)
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 1000, // Increased for free tier
//   message: { error: 'Too many requests, please try again later.' }
// });
// app.use(limiter);

// Rate limiting disabled for free tier
// const authLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 100,
//   message: { error: 'Too many authentication attempts, please try again later.' }
// });

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check tables
    let tables = [];
    try {
      tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `;
    } catch (e) {
      // Ignore
    }
    
    res.json({ 
      status: 'ok', 
      database: 'connected',
      tables: tables.map(t => t.table_name),
      tableCount: tables.length,
      version: '2.0',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      timestamp: new Date().toISOString() 
    });
  }
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/webhooks', webhookRouter);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'KingdomScout API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      properties: '/api/properties',
      user: '/api/user',
      admin: '/api/admin',
      subscription: '/api/subscription'
    }
  });
});

// Error handling
app.use(errorHandler);

// Serve frontend static files
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/webhooks')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
