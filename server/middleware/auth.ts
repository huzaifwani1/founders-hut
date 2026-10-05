import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { ENV } from '../config/env';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'MEMBER' | 'ADMIN';
    verificationLevel?: string;
    isSuspended?: boolean;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string; email: string; role: 'MEMBER' | 'ADMIN' };

    // Check if user is suspended in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, isSuspended: true, verifications: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    if (!user) {
      return res.status(401).json({ error: 'Account no longer exists' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'Account suspended. Access revoked immediately.' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      verificationLevel: user.verifications[0]?.level || 'UNVERIFIED',
      isSuspended: false
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired access token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin privileges required' });
  }
  next();
};

// Access Control Gate: Ensures user is verified before accessing high-trust features (Requests, Intros, Messaging)
export const requireVerification = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const level = req.user.verificationLevel;
  const isVerified = level === 'VERIFIED_FOUNDER' || level === 'VERIFIED_EXECUTIVE' || level === 'VERIFIED_MEMBER';

  if (!isVerified && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Access restricted: Verification required',
      code: 'VERIFICATION_REQUIRED',
      level
    });
  }

  next();
};

export const generateTokens = (user: { id: string; email: string; role: 'MEMBER' | 'ADMIN' }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    ENV.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, jti: Math.random().toString(36).substring(2) + Date.now().toString(36) },
    ENV.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};
