import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Create a report
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetType, targetId, reason, details, reportedUserId } = req.body;

    if (!targetType || !targetId || !reason) {
      res.status(400).json({ error: 'targetType, targetId, and reason are required' });
      return;
    }

    const report = await prisma.report.create({
      data: {
        reporterId: req.user!.id,
        targetType,
        targetId,
        reportedUserId: reportedUserId || null,
        reason,
        details: details || null,
        status: 'OPEN',
      },
    });

    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: List reports
router.get('/admin/list', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: { id: true, email: true, profile: { select: { name: true } } },
        },
        reportedUser: {
          select: { id: true, email: true, profile: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ reports });
  } catch (error) {
    console.error('List reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Update report status
router.put('/admin/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = ['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const existingReport = await prisma.report.findUnique({ where: { id } });
    if (!existingReport) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    const report = await prisma.report.update({
      where: { id },
      data: { status },
    });

    // Create Audit Log for moderation action
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: `REPORT_STATUS_${status}`,
        targetType: 'REPORT',
        targetId: id,
        ipAddress: req.ip || null,
        metadata: JSON.stringify({ previousStatus: existingReport.status, newStatus: status, adminNotes: adminNotes || null }),
      },
    });

    res.json({ message: 'Report status updated successfully', report });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
