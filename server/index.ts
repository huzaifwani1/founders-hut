import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { ENV } from './config/env';
import { requestLogger } from './middleware/logger';
import apiRouter from './routes/index';

const app = express();
const prisma = new PrismaClient();

// Security Middlewares & Logger
const allowedOriginsList = (ENV.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOriginsList.length === 0 ||
      allowedOriginsList.includes('*') ||
      allowedOriginsList.includes(origin) ||
      origin.endsWith('.onrender.com') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    return callback(null, origin);
  },
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Disable x-powered-by header to prevent server fingerprinting
app.disable('x-powered-by');

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Healthcheck endpoint (liveness probe)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: ENV.NODE_ENV });
});

// Readiness check endpoint (readiness probe - verifies database connection)
app.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'unready', database: 'disconnected', error: 'Database connection check failed' });
  }
});

// API Routes Versioned Mount
app.use('/api', apiRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.VITEST !== 'true') {
  app.listen(ENV.PORT, () => {
    console.log(`⚡ Founders Hut MVP Server running on http://localhost:${ENV.PORT}`);
  });
}

export default app;
