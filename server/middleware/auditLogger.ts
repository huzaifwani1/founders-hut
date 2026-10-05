import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const logAuditEvent = async (
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  ipAddress?: string,
  metadata?: object
) => {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        ipAddress: ipAddress || '127.0.0.1',
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};
