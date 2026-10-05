import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateBody } from '../../middleware/validate';
import { generateTokens, authenticateToken, AuthRequest } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';
import { ENV } from '../../config/env';
import { isCorporateDomain } from '../../services/verificationPipelineServer';

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  role: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8),
});

// Step 1 Onboarding: Register new account
router.post('/register', authLimiter, validateBody(registerSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, role, company, industry, location } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // Account Enumeration Protection: Generic response
      return res.status(200).json({
        message: 'Account registration initiated. If this email is new, your account was created.',
        requiresLogin: true
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userName = name || 'Executive Member';
    const initials = userName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const hasCorporate = isCorporateDomain(email);
    const initialLevel = hasCorporate ? 'VERIFIED_FOUNDER' : 'UNVERIFIED';

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'MEMBER',
        onboardingStep: 2,
        profile: {
          create: {
            name: userName,
            initials,
            role: role || 'Founder / Executive',
            company: company || 'Stealth Enterprise',
            companyStage: 'SERIES_A',
            industry: industry || 'Technology',
            location: location || 'Remote',
            bio: `${role || 'Executive'} at ${company || 'Stealth Enterprise'}.`,
            canHelpWithJson: JSON.stringify([]),
            lookingForJson: JSON.stringify([]),
            skillsJson: JSON.stringify([])
          }
        },
        verifications: {
          create: {
            level: initialLevel,
            identityVerified: true,
            corporateDomainVerified: hasCorporate,
            entityVerified: hasCorporate,
            founderStatusVerified: hasCorporate
          }
        }
      },
      include: {
        profile: true,
        verifications: true
      }
    });

    // Priority 2: Real Work Email Verification — Generate single-use token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        used: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 Hours
      }
    });

    // Send email verification via emailService abstraction
    const { emailService } = await import('../../services/emailService');
    await emailService.sendEmailVerification(user.email, verificationToken);

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

    // Store refresh token for revocation tracking
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return res.status(201).json({
      message: 'Executive account created successfully. Verification token sent to work email.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        onboardingStep: user.onboardingStep,
        profile: user.profile,
        verification: user.verifications[0]
      },
      ...tokens
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login
router.post('/login', authLimiter, validateBody(loginSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        verifications: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email credentials or password' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'Account suspended. Access revoked immediately.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email credentials or password' });
    }

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

    // Track refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return res.json({
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        onboardingStep: user.onboardingStep,
        profile: user.profile,
        verification: user.verifications[0] || null
      },
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

// Refresh Token Rotation with revocation check
router.post('/refresh', async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET) as { id: string; email: string; role: 'MEMBER' | 'ADMIN' };

    // Check if token was revoked in DB
    const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!storedToken || storedToken.revoked) {
      return res.status(403).json({ error: 'Revoked or invalid refresh token' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.isSuspended) {
      return res.status(403).json({ error: 'Invalid refresh token or user suspended' });
    }

    // Revoke previous refresh token and issue new token pair
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true }
    });

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return res.json(tokens);
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
});

// Logout (Revoke refresh tokens)
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId: req.user!.id },
        data: { revoked: true }
      });
    }
    return res.json({ message: 'Session logged out and refresh token revoked' });
  } catch (error) {
    return res.status(500).json({ error: 'Logout processing error' });
  }
});

// Forgot Password (Account Enumeration Safe)
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.isSuspended) {
      const resetTokenStr = crypto.randomBytes(32).toString('hex');
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetTokenStr,
          expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour expiry
        }
      });
      // In production: Send transactional email via Mailgun/Resend/Postmark
    }

    // Always return uniform enumeration-safe response
    return res.json({
      message: 'If an account exists for this corporate email, password reset instructions have been sent.'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error processing password reset request' });
  }
});

// Reset Password
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { used: true }
      }),
      // Revoke all active refresh tokens for security
      prisma.refreshToken.updateMany({
        where: { userId: resetRecord.userId },
        data: { revoked: true }
      })
    ]);

    return res.json({ message: 'Password reset successfully. Please log in with your new credentials.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error resetting password' });
  }
});

// Current authenticated user session
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        profile: true,
        verifications: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!user) {
      return res.status(440).json({ error: 'User session invalid' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      onboardingStep: user.onboardingStep,
      profile: user.profile,
      verification: user.verifications[0] || null
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch current user profile' });
  }
});

export default router;
