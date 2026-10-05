import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Block a member
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { blockedId } = req.body;
    const blockerId = req.user!.id;

    if (!blockedId) {
      res.status(400).json({ error: 'blockedId is required' });
      return;
    }

    if (blockedId === blockerId) {
      res.status(400).json({ error: 'Cannot block yourself' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id: blockedId } });
    if (!targetUser) {
      res.status(404).json({ error: 'User to block does not exist' });
      return;
    }

    const existingBlock = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });

    if (existingBlock) {
      res.json({ message: 'User is already blocked', block: existingBlock });
      return;
    }

    const block = await prisma.userBlock.create({
      data: {
        blockerId,
        blockedId,
      },
    });

    res.status(201).json({ message: 'User blocked successfully', block });
  } catch (error) {
    console.error('Block member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unblock a member
router.delete('/:blockedId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { blockedId } = req.params;
    const blockerId = req.user!.id;

    const existingBlock = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });

    if (!existingBlock) {
      res.status(404).json({ error: 'Block relationship not found' });
      return;
    }

    await prisma.userBlock.delete({
      where: {
        id: existingBlock.id,
      },
    });

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List blocked members for current user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const blockerId = req.user!.id;
    const blocks = await prisma.userBlock.findMany({
      where: { blockerId },
      include: {
        blocked: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { name: true, role: true, company: true, avatar: true },
            },
          },
        },
      },
    });

    res.json({ blocks });
  } catch (error) {
    console.error('List blocked members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
