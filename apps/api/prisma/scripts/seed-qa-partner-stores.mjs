import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const CONFIRMATION = 'SEED_QA_PARTNER_STORES';
const TEAM_MEMBERS = ['taeseong', 'yunji', 'eunji', 'seunghun', 'jaehyuk', 'test'];

if (process.env.CONFIRM_SEED !== CONFIRMATION) {
    throw new Error(`Set CONFIRM_SEED=${CONFIRMATION} to create QA partner stores.`);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

function storeTime(hour, minute = 0) {
    return new Date(Date.UTC(1970, 0, 1, hour, minute));
}

async function main() {
    const now = new Date();

    for (const [index, name] of TEAM_MEMBERS.entries()) {
        const email = `${name}.partner@test.com`;
        const slug = `qa-${name}-studio`;
        const partner = await prisma.partner.findFirst({
            where: { user: { email } },
            select: { id: true, userId: true },
        });

        if (!partner) {
            throw new Error(`QA partner not found: ${email}`);
        }

        const store = await prisma.store.upsert({
            where: { slug },
            update: {
                partnerId: partner.id,
                name: `${name} QA 공방`,
                description: 'QA 테스트용으로 생성된 공방입니다.',
                address: '서울특별시 성동구 성수동',
                latitude: 37.5445 + index * 0.001,
                longitude: 127.056 + index * 0.001,
                regionSido: '서울',
                regionSigungu: '성동구',
                regionDong: '성수동',
                phone: `02-0000-000${index + 1}`,
                convenienceInfo: { pet: true, wifi: true, parking: true },
                autoConfirm: true,
                cancelDeadlineDays: 1,
                reservationIntervalMinutes: 60,
                maxCapacityPerSlot: 10,
                status: 'PUBLISHED',
                publishedAt: now,
                rejectedReason: null,
                suspendedReason: null,
            },
            create: {
                partnerId: partner.id,
                name: `${name} QA 공방`,
                slug,
                description: 'QA 테스트용으로 생성된 공방입니다.',
                address: '서울특별시 성동구 성수동',
                latitude: 37.5445 + index * 0.001,
                longitude: 127.056 + index * 0.001,
                regionSido: '서울',
                regionSigungu: '성동구',
                regionDong: '성수동',
                phone: `02-0000-000${index + 1}`,
                convenienceInfo: { pet: true, wifi: true, parking: true },
                autoConfirm: true,
                cancelDeadlineDays: 1,
                reservationIntervalMinutes: 60,
                maxCapacityPerSlot: 10,
                status: 'PUBLISHED',
                publishedAt: now,
            },
            select: { id: true, name: true, slug: true },
        });

        await prisma.$transaction([
            prisma.storeOperatingHour.deleteMany({ where: { storeId: store.id } }),
            prisma.businessDocument.deleteMany({ where: { storeId: store.id } }),
        ]);

        await prisma.storeOperatingHour.createMany({
            data: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((dayOfWeek) => ({
                storeId: store.id,
                dayOfWeek,
                openTime: storeTime(9),
                closeTime: storeTime(18),
            })),
        });

        await prisma.businessDocument.create({
            data: {
                partnerId: partner.id,
                storeId: store.id,
                email,
                ownerName: name,
                businessName: `${name} QA 공방`,
                businessNumber: `QA-${String(index + 1).padStart(7, '0')}`,
                businessAddress: '서울특별시 성동구 성수동',
                startDate: '20260101',
                verificationStatus: 'VERIFIED',
                verifiedAt: now,
                verificationCheckedAt: now,
                businessState: 'ACTIVE',
                ntsRaw: { source: 'qa-seed', bypassed: true },
                createdAt: now,
            },
        });

        await prisma.partner.update({
            where: { id: partner.id },
            data: {
                status: 'APPROVED',
                approvedAt: now,
                lastAccessedStoreId: store.id,
            },
        });
        await prisma.user.update({
            where: { id: partner.userId },
            data: { isPartner: true },
        });

        console.log(`[seed-store] ${email} -> ${store.name} (${store.slug})`);
    }

    const stores = await prisma.store.findMany({
        where: { slug: { in: TEAM_MEMBERS.map((name) => `qa-${name}-studio`) } },
        select: {
            name: true,
            slug: true,
            status: true,
            partner: { select: { user: { select: { email: true } } } },
            businessDocs: { select: { verificationStatus: true, businessState: true } },
        },
        orderBy: { slug: 'asc' },
    });
    console.log(JSON.stringify(stores, null, 2));
}

try {
    await main();
} finally {
    await prisma.$disconnect();
}
