import { Router } from 'express';
import authRoutes from './v1/authRoutes';
import profileRoutes from './v1/profileRoutes';
import verificationRoutes from './v1/verificationRoutes';
import discoverRoutes from './v1/discoverRoutes';
import requestRoutes from './v1/requestRoutes';
import introRoutes from './v1/introRoutes';
import connectionRoutes from './v1/connectionRoutes';
import messageRoutes from './v1/messageRoutes';
import notificationRoutes from './v1/notificationRoutes';
import adminRoutes from './v1/adminRoutes';
import reportRoutes from './v1/reportRoutes';
import blockRoutes from './v1/blockRoutes';
import feedbackRoutes from './v1/feedbackRoutes';
import analyticsRoutes from './v1/analyticsRoutes';
import communityRoutes from './v1/communityRoutes';
import investorRoutes from './v1/investorRoutes';
import helpRoutes from './v1/helpRoutes';
import postRoutes from './v1/postRoutes';
import resolutionRoutes from './v1/resolutionRoutes';

const router = Router();

// Versioned API v1 Router Mounts
router.use('/v1/auth', authRoutes);
router.use('/v1/profiles', profileRoutes);
router.use('/v1/verifications', verificationRoutes);
router.use('/v1/discover', discoverRoutes);
router.use('/v1/requests', requestRoutes);
router.use('/v1/introductions', introRoutes);
router.use('/v1/connections', connectionRoutes);
router.use('/v1/messages', messageRoutes);
router.use('/v1/notifications', notificationRoutes);
router.use('/v1/admin', adminRoutes);
router.use('/v1/reports', reportRoutes);
router.use('/v1/blocks', blockRoutes);
router.use('/v1/feedback', feedbackRoutes);
router.use('/v1/analytics', analyticsRoutes);
router.use('/v1/communities', communityRoutes);
router.use('/v1/investors', investorRoutes);
router.use('/v1/help', helpRoutes);
router.use('/v1/posts', postRoutes);
router.use('/v1/resolutions', resolutionRoutes);

export default router;
