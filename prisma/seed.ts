import { PrismaClient } from '@src/generated/prisma';
import bcrypt from 'bcryptjs';
import logger from '@src/common/utils/logger';

const prisma = new PrismaClient();

async function main() {
    logger.info('🌱 Starting database seeding...');

    try {
        // Create sample user for testing
        logger.info('Creating sample user...');

        const password = await bcrypt.hash('password123!', 12);

        const user = await prisma.user.upsert({
            where: { email: 'user@example.com' },
            update: {},
            create: {
                email: 'user@example.com',
                username: 'sampleuser',
                password: password,
                firstName: 'Sample',
                lastName: 'User',
                isActive: true,
            },
        });

        logger.info('✅ Created sample user: user@example.com (password: password123!)');

        logger.info('🎉 Database seeding completed successfully!');
        logger.info('');
        logger.info('📝 Default user created:');
        logger.info('   Email: user@example.com');
        logger.info('   Password: password123!');
        logger.info('');
        logger.info('🔐 Remember to change this password in production!');

    } catch (error) {
        logger.err('❌ Error during seeding:');
        logger.err(error);
        throw error;
    }
}

main()
    .catch((e) => {
        logger.err(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
