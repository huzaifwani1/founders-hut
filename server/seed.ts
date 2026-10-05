import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Founders Hut development database...');

  // Clean existing tables
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.introduction.deleteMany();
  await prisma.request.deleteMany();
  await prisma.verificationDocument.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.employment.deleteMany();
  await prisma.company.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Admin Account
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@foundershut.com',
      passwordHash: defaultPassword,
      role: 'ADMIN',
      onboardingStep: 7,
      profile: {
        create: {
          name: '[DEV SEED] Platform Admin',
          initials: 'PA',
          role: 'Operations & Audit Lead',
          company: 'Founders Hut Network',
          industry: 'Venture Governance',
          location: 'San Francisco / Remote',
          bio: 'Auditing corporate identity, founder cap tables, and executive verification credentials.',
          canHelpWithJson: JSON.stringify(['Platform Governance', 'Verification Audit']),
          lookingForJson: JSON.stringify(['High-signal verified founders']),
          skillsJson: JSON.stringify(['Governance', 'Venture Verification'])
        }
      }
    }
  });

  // 2. Verified Member: [DEV SEED] Alex Chen
  const userAlex = await prisma.user.create({
    data: {
      email: 'alex@aethermetrics.io',
      passwordHash: defaultPassword,
      role: 'MEMBER',
      onboardingStep: 7,
      profile: {
        create: {
          name: '[DEV SEED] Alex Chen',
          initials: 'AC',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          role: 'Co-Founder & CEO',
          company: 'Aether Metrics',
          companyStage: 'SERIES_A',
          industry: 'Enterprise Software / AI',
          location: 'Bengaluru / San Francisco',
          bio: 'Building enterprise telemetry for autonomous AI agents. Previously VP of Product. Angel investor in 14 B2B startups.',
          canHelpWithJson: JSON.stringify([
            'Enterprise SaaS pricing & packaging models',
            'Scaling B2B sales teams from $1M to $10M ARR',
            'US market expansion & Delaware C-Corp entity setup'
          ]),
          lookingForJson: JSON.stringify([
            'Founders who have deployed LLM agent monitoring in high-compliance fintech',
            'Senior VP of Engineering candidate with distributed systems background'
          ]),
          skillsJson: JSON.stringify(['B2B SaaS', 'Fundraising', 'GTM Strategy', 'Executive Hiring']),
          arrValue: '$4.2M',
          arrSource: 'Self-Reported by Founder',
          arrIsSelfReported: true,
          teamSizeValue: '38 members',
          teamSizeSource: 'Verified Payroll',
          teamSizeIsSelfReported: false,
          fundingValue: '$8.5M',
          fundingSource: 'Verified SEC/VC Filings',
          fundingIsSelfReported: false
        }
      },
      verifications: {
        create: {
          level: 'VERIFIED_FOUNDER',
          identityVerified: true,
          corporateDomainVerified: true,
          entityVerified: true,
          founderStatusVerified: true
        }
      }
    }
  });

  // 3. Verified Member: [DEV SEED] Tariq Bhatt
  const userTariq = await prisma.user.create({
    data: {
      email: 'tariq@kashmirvalleyorganics.com',
      passwordHash: defaultPassword,
      role: 'MEMBER',
      onboardingStep: 7,
      profile: {
        create: {
          name: '[DEV SEED] Tariq Bhatt',
          initials: 'TB',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
          role: 'Founder & Managing Director',
          company: 'Kashmir Valley Organics',
          companyStage: 'GROWTH',
          industry: 'Consumer Brands / D2C',
          location: 'Srinagar / Jammu',
          bio: 'Pioneered cold-chain D2C logistics for Himalayan botanicals & high-value agricultural exports. Scaled revenue past ₹28Cr across North India.',
          canHelpWithJson: JSON.stringify([
            'Expanding consumer products from Kashmir into Jammu & Tier-1 retail',
            'Perishable cold-chain logistics across rugged geographies',
            'Scaling D2C brand from ₹1Cr to ₹30Cr without venture dilution'
          ]),
          lookingForJson: JSON.stringify([
            'Introductions to modern trade retail category managers in Mumbai & NCR',
            'Founders experienced in quick-commerce dark store partnerships'
          ]),
          skillsJson: JSON.stringify(['D2C Operations', 'Supply Chain', 'Tier-2/3 Retail Distribution', 'Bootstrapping']),
          arrValue: '₹28Cr',
          arrSource: 'Self-Reported by Founder',
          arrIsSelfReported: true,
          teamSizeValue: '85 members',
          teamSizeSource: 'Verified Audit',
          teamSizeIsSelfReported: false,
          relationshipNotes: 'Connected via warm introduction in 2025 re: Tier-2 retail distribution.'
        }
      },
      verifications: {
        create: {
          level: 'VERIFIED_FOUNDER',
          identityVerified: true,
          corporateDomainVerified: true,
          entityVerified: true,
          founderStatusVerified: true
        }
      }
    }
  });

  // 4. Verified Member: [DEV SEED] Devika Singhania
  const userDevika = await prisma.user.create({
    data: {
      email: 'devika@quantis.ai',
      passwordHash: defaultPassword,
      role: 'MEMBER',
      onboardingStep: 7,
      profile: {
        create: {
          name: '[DEV SEED] Devika Singhania',
          initials: 'DS',
          avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
          role: 'Co-Founder & CTO',
          company: 'Quantis AI',
          companyStage: 'SERIES_A',
          industry: 'DeepTech / AI Infrastructure',
          location: 'Bengaluru / London',
          bio: 'Ex-DeepMind research lead. Building deterministic evaluation platforms for financial LLMs. Y Combinator W22 alum.',
          canHelpWithJson: JSON.stringify([
            'LLM evaluation & benchmark design for regulated domains',
            'Architecting sub-10ms inference pipelines in Rust & C++',
            'Hiring senior AI research engineers'
          ]),
          lookingForJson: JSON.stringify([
            'Design partners among CTOs of Series B+ Fintechs',
            'Advice on SOC2 Type II compliance automation'
          ]),
          skillsJson: JSON.stringify(['Deep Learning', 'Rust', 'Fintech Infrastructure', 'YC Alumni']),
          arrValue: '$1.8M',
          arrSource: 'Self-Reported',
          arrIsSelfReported: true,
          teamSizeValue: '22 members',
          teamSizeSource: 'Verified Payroll',
          teamSizeIsSelfReported: false,
          fundingValue: '$5.0M',
          fundingSource: 'Verified SEC/VC Filings',
          fundingIsSelfReported: false,
          relationshipNotes: 'Met at YC W22 cohort dinner in San Francisco.'
        }
      },
      verifications: {
        create: {
          level: 'VERIFIED_FOUNDER',
          identityVerified: true,
          corporateDomainVerified: true,
          entityVerified: true,
          founderStatusVerified: true
        }
      }
    }
  });

  // Create Connection between userAlex and userTariq
  await prisma.connection.create({
    data: {
      userAId: userAlex.id,
      userBId: userTariq.id,
      relationshipNotes: 'Connected via warm intro re: North India supply chain.'
    }
  });

  // Create Connection between userAlex and userDevika
  await prisma.connection.create({
    data: {
      userAId: userAlex.id,
      userBId: userDevika.id,
      relationshipNotes: 'Met at YC W22 cohort dinner in San Francisco.'
    }
  });

  // Create Request by Tariq
  await prisma.request.create({
    data: {
      authorId: userTariq.id,
      needCategory: 'EXPANSION',
      title: 'Seeking a founder who has expanded consumer retail from Kashmir into Jammu & NCR networks',
      needDescription: 'We are expanding our Himalayan botanical D2C brand into physical retail chains in Jammu and NCR. Need direct operational tactical advice on regional distributor margin structures, cold-chain preservation during transit, and slotting fee negotiations.',
      context: 'We have scaled to ₹28Cr ARR online, but regional offline distribution is our next major milestone.',
      industry: 'Consumer Goods / D2C',
      location: 'Kashmir / Jammu / NCR',
      desiredConnection: 'Founder or VP of Sales who has built physical retail footprint across North India.',
      urgency: 'URGENT',
      status: 'OPEN',
      responsesCount: 4
    }
  });

  // Create Conversation between userAlex and userTariq
  const conv1 = await prisma.conversation.create({
    data: {
      participantAId: userAlex.id,
      participantBId: userTariq.id,
      topic: 'Request #101: Consumer Expansion in Kashmir & Jammu',
      facilitatedBy: 'Warm Intro Pathway',
      lastMessage: 'Appreciate the intro to the Jammu distributor network! Let us schedule a quick call this Thursday.'
    }
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv1.id,
        senderId: userTariq.id,
        text: 'Hi Alex, warm intro mentioned you recently helped another D2C founder structure their North India offline supply chain.'
      },
      {
        conversationId: conv1.id,
        senderId: userAlex.id,
        text: 'Glad to connect Tariq! Yes, we worked closely with a beverage brand setting up regional fulfillment across Jammu and Punjab. Happy to share our operational playbook.'
      },
      {
        conversationId: conv1.id,
        senderId: userTariq.id,
        text: 'Appreciate the intro to the Jammu distributor network! Let us schedule a quick call this Thursday.'
      }
    ]
  });

  console.log('✅ Founders Hut development database seeded successfully!');
  console.log('👤 Member [DEV SEED]: alex@aethermetrics.io / password123');
  console.log('👑 Admin [DEV SEED]: admin@foundershut.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
