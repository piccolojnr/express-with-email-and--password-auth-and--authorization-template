import { PrismaClient } from '@src/generated/prisma';
import bcrypt from 'bcryptjs';
import logger from '@src/common/utils/logger';
import { SYSTEM_ROLES } from '@src/models/role';

const prisma = new PrismaClient();

async function main() {
    logger.info('🌱 Starting database seeding...');

    try {
        // Create system roles (if using authorization)
        logger.info('Creating system roles...');

        const roles = await Promise.all(
            Object.values(SYSTEM_ROLES).map(async (roleData) => {
                return await prisma.role.upsert({
                    where: { name: roleData.name },
                    update: {},
                    create: {
                        name: roleData.name,
                        displayName: roleData.displayName,
                        description: roleData.description,
                        permissions: roleData.permissions,
                        isSystem: roleData.isSystem,
                    },
                });
            })
        );

        logger.info(`✅ Created ${roles.length} system roles`);

        // Create admin user
        logger.info('Creating admin user...');

        const adminPassword = await bcrypt.hash('admin123!', 12);

        const adminUser = await prisma.user.upsert({
            where: { email: 'admin@example.com' },
            update: {},
            create: {
                email: 'admin@example.com',
                username: 'admin',
                password: adminPassword,
                firstName: 'Admin',
                lastName: 'User',
                isActive: true,
            },
        });

        // Assign admin role to admin user (if using authorization)
        const adminRole = roles.find(role => role.name === 'admin');
        if (adminRole) {
            await prisma.userRole.upsert({
                where: {
                    userId_roleId: {
                        userId: adminUser.id,
                        roleId: adminRole.id,
                    },
                },
                update: {},
                create: {
                    userId: adminUser.id,
                    roleId: adminRole.id,
                },
            });
        }

        logger.info('✅ Created admin user: admin@example.com (password: admin123!)');

        // Create test user
        logger.info('Creating test user...');

        const testPassword = await bcrypt.hash('test123!', 12);

        const testUser = await prisma.user.upsert({
            where: { email: 'test@example.com' },
            update: {},
            create: {
                email: 'test@example.com',
                username: 'testuser',
                password: testPassword,
                firstName: 'Test',
                lastName: 'User',
                isActive: true,
            },
        });

        // Assign user role to test user (if using authorization)
        const userRole = roles.find(role => role.name === 'user');
        if (userRole) {
            await prisma.userRole.upsert({
                where: {
                    userId_roleId: {
                        userId: testUser.id,
                        roleId: userRole.id,
                    },
                },
                update: {},
                create: {
                    userId: testUser.id,
                    roleId: userRole.id,
                },
            });
        }

        logger.info('✅ Created test user: test@example.com (password: test123!)');

        logger.info('🎉 Database seeding completed successfully!');
        logger.info('');
        logger.info('📝 Default users created:');
        logger.info('   Admin: admin@example.com / admin123!');
        logger.info('   Test:  test@example.com / test123!');
        logger.info('');
        logger.info('🔐 Remember to change these passwords in production!');

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
