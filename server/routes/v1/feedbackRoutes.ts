import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Submit product feedback
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'Feedback content is required' });
      return;
    }

    const feedback = await prisma.productFeedback.create({
      data: {
        userId: req.user!.id,
        category: category || 'GENERAL',
        content: content.trim(),
      },
    });

    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
