import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const CONFIRMATION = 'RESET_NON_POLICY_DATA';
const QA_PASSWORD = 'test1234!';
const TEAM_MEMBERS = ['taeseong', 'yunji', 'eunji', 'seunghun', 'jaehyuk'];

if (process.env.CONFIRM_RESET !== CONFIRMATION) {
    throw new Error(`Set CONFIRM_RESET=${CONFIRMATION} to run this destructive reset.`);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
}

const target = new URL(databaseUrl);
const adapter = new PrismaPg({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

const preservedTables = new Set(['policy_versions', '_prisma_migrations']);

async function main() {
    const tables = await prisma.$queryRawUnsafe(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    `);
    const resetTables = tables
        .map(({ tablename }) => tablename)
        .filter((table) => !preservedTables.has(table));
    const policyCountBefore = await prisma.policyVersion.count();
    const passwordHash = await bcrypt.hash(QA_PASSWORD, 10);

    console.log(
        `[reset] target=${target.hostname}/${target.pathname.slice(1)} resetTables=${resetTables.length} preservedPolicies=${policyCountBefore}`,
    );

    await prisma.$transaction(async (tx) => {
        const quotedTables = resetTables.map((table) => `"public"."${table}"`).join(', ');
        if (quotedTables) {
            await tx.$executeRawUnsafe(`TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE`);
        }

        for (const name of TEAM_MEMBERS) {
            await tx.user.create({
                data: {
                    email: `${name}.user@test.com`,
                    nickname: `${name} user`,
                    password: passwordHash,
                    emailVerified: true,
                },
            });
        }

        for (const name of TEAM_MEMBERS) {
            await tx.user.create({
                data: {
                    email: `${name}.partner@test.com`,
                    nickname: `${name} partner`,
                    password: passwordHash,
                    emailVerified: true,
                    isPartner: true,
                    partner: {
                        create: {
                            status: 'APPROVED',
                            approvedAt: new Date(),
                        },
                    },
                },
            });
        }

        for (const name of TEAM_MEMBERS) {
            await tx.admin.create({
                data: {
                    email: `${name}.admin@test.com`,
                    name: `${name} admin`,
                    password: passwordHash,
                    createdAt: new Date(),
                },
            });
        }
    });

    const [policyCountAfter, userCount, partnerCount, adminCount] = await Promise.all([
        prisma.policyVersion.count(),
        prisma.user.count(),
        prisma.partner.count(),
        prisma.admin.count(),
    ]);

    console.log(
        `[reset] complete policies=${policyCountAfter} users=${userCount} partners=${partnerCount} admins=${adminCount}`,
    );
    console.log(`[reset] shared QA password=${QA_PASSWORD}`);
}

try {
    await main();
} finally {
    await prisma.$disconnect();
}
