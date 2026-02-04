import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
// import rateLimit from 'express-rate-limit';
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

// Run database schema push at startup (for production deployments)
if (process.env.NODE_ENV === 'production') {
  console.log('Running Prisma db push...');
  try {
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('Database schema pushed successfully');
  } catch (error) {
    console.error('Failed to push database schema:', error);
    // Continue anyway - tables might already exist
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow Railway domains
    if (origin.endsWith('.railway.app')) return callback(null, true);

    // Allow configured origins
    if (allowedOrigins.includes(origin)) return callback(null, true);

    callback(new Error('Not allowed by CORS'));
  },
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
    let tables: any[] = [];
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

// Serve local images
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/images', imagesRouter);
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

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
