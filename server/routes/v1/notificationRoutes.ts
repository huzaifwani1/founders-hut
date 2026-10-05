import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get notifications for current user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden: Unauthorized to update this notification' });
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

export default router;
