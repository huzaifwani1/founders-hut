import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            verifications: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        }
      }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json(profile);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile fields
router.put('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      role,
      company,
      companyStage,
      industry,
      location,
      bio,
      yearsBuilding,
      founderStage,
      canHelpWith,
      lookingFor,
      skills,
      arrValue,
      teamSizeValue,
      fundingValue
    } = req.body;

    const updatedProfile = await prisma.profile.update({
      where: { userId: req.user!.id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(company && { company }),
        ...(companyStage && { companyStage }),
        ...(industry && { industry }),
        ...(location && { location }),
        ...(bio !== undefined && { bio }),
        ...(yearsBuilding !== undefined && { yearsBuilding }),
        ...(founderStage && { founderStage }),
        ...(canHelpWith && { canHelpWithJson: JSON.stringify(canHelpWith) }),
        ...(lookingFor && { lookingForJson: JSON.stringify(lookingFor) }),
        ...(skills && { skillsJson: JSON.stringify(skills) }),
        ...(arrValue !== undefined && { arrValue, arrSource: 'Self-Reported by Founder', arrIsSelfReported: true }),
        ...(teamSizeValue !== undefined && { teamSizeValue }),
        ...(fundingValue !== undefined && { fundingValue })
      }
    });

    return res.json(updatedProfile);
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update profile by user ID with IDOR check
router.put('/:userId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.params.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: You cannot modify another executive profile' });
    }

    const {
      name,
      role,
      company,
      companyStage,
      industry,
      location,
      bio,
      yearsBuilding,
      founderStage,
      canHelpWith,
      lookingFor,
      skills,
      arrValue,
      teamSizeValue,
      fundingValue
    } = req.body;

    const updatedProfile = await prisma.profile.update({
      where: { userId: req.params.userId },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(company && { company }),
        ...(companyStage && { companyStage }),
        ...(industry && { industry }),
        ...(location && { location }),
        ...(bio !== undefined && { bio }),
        ...(yearsBuilding !== undefined && { yearsBuilding }),
        ...(founderStage && { founderStage }),
        ...(canHelpWith && { canHelpWithJson: JSON.stringify(canHelpWith) }),
        ...(lookingFor && { lookingForJson: JSON.stringify(lookingFor) }),
        ...(skills && { skillsJson: JSON.stringify(skills) }),
        ...(arrValue !== undefined && { arrValue, arrSource: 'Self-Reported by Founder', arrIsSelfReported: true }),
        ...(teamSizeValue !== undefined && { teamSizeValue }),
        ...(fundingValue !== undefined && { fundingValue })
      }
    });

    return res.json(updatedProfile);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update executive profile' });
  }
});

// Get profile by user ID
router.get('/:userId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user!.id;

    if (targetUserId !== currentUserId && req.user!.role !== 'ADMIN') {
      const blockExists = await prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: currentUserId, blockedId: targetUserId },
            { blockerId: targetUserId, blockedId: currentUserId },
          ],
        },
      });

      if (blockExists) {
        return res.status(403).json({ error: 'Access blocked' });
      }
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: targetUserId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            verifications: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        }
      }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Executive profile not found' });
    }

    return res.json(profile);
  } catch (error) {
    return res.status(500).json({ error: 'Error retrieving executive profile' });
  }
});

export default router;
