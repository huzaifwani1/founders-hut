import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Generate secure ephemeral dev secrets if not specified in environment
const generateDevSecret = (name: string): string => {
  if (process.env[name]) return process.env[name]!;
  if (isProduction) {
    throw new Error(`CRITICAL SECURITY ERROR: Environment variable ${name} must be explicitly defined in production!`);
  }
  console.warn(`⚠️ SECURITY NOTICE: ${name} not set in .env. Generating ephemeral dev secret for local session.`);
  return crypto.randomBytes(32).toString('hex');
};

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5001,
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: generateDevSecret('JWT_SECRET'),
  JWT_REFRESH_SECRET: generateDevSecret('JWT_REFRESH_SECRET'),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
