import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    console.error('Usage: ADMIN_EMAIL="admin@domain.com" ADMIN_PASSWORD="SecurePassword123!" npm run create-admin');
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  if (existingUser) {
    const updated = await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        passwordHash,
        emailVerified: true,
        onboardingStep: 7,
      },
    });
    console.log(`[ADMIN CREATED] Updated existing user (${updated.email}) to ADMIN role.`);
  } else {
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'ADMIN',
        emailVerified: true,
        onboardingStep: 7,
        profile: {
          create: {
            name: 'Founders Hut Administrator',
            initials: 'AD',
            role: 'Platform Operations Admin',
            company: 'Founders Hut',
            companyStage: 'GROWTH',
            industry: 'Network Operations',
            location: 'Global',
            bio: 'Official Founders Hut verification audit administrator.',
          },
        },
        verifications: {
          create: {
            level: 'VERIFIED_EXECUTIVE',
            identityVerified: true,
            corporateDomainVerified: true,
            entityVerified: true,
            founderStatusVerified: true,
          },
        },
      },
    });
    console.log(`[ADMIN CREATED] Provisioned new production ADMIN account: ${newUser.email}`);
  }
}

main()
  .catch((e) => {
    console.error('Failed to create admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
