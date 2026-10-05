import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get connections for current user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { userAId: req.user!.id },
          { userBId: req.user!.id }
        ]
      },
      include: {
        userA: { select: { id: true, email: true, profile: true, verifications: { orderBy: { createdAt: 'desc' }, take: 1 } } },
        userB: { select: { id: true, email: true, profile: true, verifications: { orderBy: { createdAt: 'desc' }, take: 1 } } }
      }
    });

    // Format output so connected peer profile is clean
    const peerConnections = connections.map((conn) => {
      const isUserA = conn.userAId === req.user!.id;
      const peer = isUserA ? conn.userB : conn.userA;
      return {
        id: conn.id,
        relationshipNotes: conn.relationshipNotes,
        establishedAt: conn.establishedAt,
        peer
      };
    });

    return res.json(peerConnections);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

// Remove connection
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const conn = await prisma.connection.findUnique({ where: { id: req.params.id } });
    if (!conn) {
      return res.status(404).json({ error: 'Connection record not found' });
    }

    if (conn.userAId !== req.user!.id && conn.userBId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: You can only disconnect your own connections' });
    }

    await prisma.connection.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Connection removed successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove connection' });
  }
});

export default router;
