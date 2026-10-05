import rateLimit from 'express-rate-limit';

const isTestEnv = process.env.NODE_ENV === 'test';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

export const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isTestEnv ? 1000 : 30,
  message: { error: 'Message rate limit exceeded. Please slow down your executive correspondence.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv
});

export const requestLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: isTestEnv ? 1000 : 10,
  message: { error: 'Request publication limit reached. Please wait before publishing another request.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv
});
