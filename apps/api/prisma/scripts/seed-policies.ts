/**
 * [운영 작업 — 별도 실행] PolicyVersion 초기 시드 스크립트.
 *
 * 배경: GET /policies/latest 가 is_latest=true 인 PolicyVersion row를 반환한다.
 *       가입 전 약관 동의 시트(FE)가 노션 링크를 API에서 동적으로 받아 표시한다.
 *
 * 대상: TERMS_OF_SERVICE / PRIVACY_POLICY / LOCATION_BASED_SERVICE 3종.
 *       MARKETING 은 가입 시트 미노출(별도 처리) → 시드 미포함.
 *
 * 약관 개정 시: 아래 POLICY_URL_* 값을 새 노션 링크로 교체하고 VERSION 을 올린 뒤 재실행한다.
 *    (같은 policyType 의 기존 isLatest=true row 는 자동으로 false 처리됨.)
 *
 * 실행 예(루트 기준):
 *   cd apps/api
 *   pnpm dlx tsx prisma/scripts/seed-policies.ts
 *
 * 중복 방지: policyType + version 조합으로 upsert.
 *            같은 버전이 이미 있으면 url/isLatest/effectiveAt 을 덮어쓴다.
 */

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, PolicyType } from '@prisma/client';

// 실제 노션 약관 링크 (외부 공개 페이지).
const POLICY_URL_TERMS =
    'https://clean-crocus-36c.notion.site/37d2ee66b06c80e4af1ae8e2e1f077e3?pvs=74';
const POLICY_URL_PRIVACY = 'https://clean-crocus-36c.notion.site/37d2ee66b06c80498b42c5bf903e36e0';
const POLICY_URL_LOCATION =
    'https://clean-crocus-36c.notion.site/37d2ee66b06c8032b5f8f4d7f6c72351?pvs=74';

const EFFECTIVE_AT = new Date('2026-01-01T00:00:00.000Z');
const VERSION = 'v1.0';

interface PolicySeedRow {
    policyType: PolicyType;
    version: string;
    url: string;
    effectiveAt: Date;
}

const seedRows: PolicySeedRow[] = [
    {
        policyType: PolicyType.TERMS_OF_SERVICE,
        version: VERSION,
        url: POLICY_URL_TERMS,
        effectiveAt: EFFECTIVE_AT,
    },
    {
        policyType: PolicyType.PRIVACY_POLICY,
        version: VERSION,
        url: POLICY_URL_PRIVACY,
        effectiveAt: EFFECTIVE_AT,
    },
    {
        policyType: PolicyType.LOCATION_BASED_SERVICE,
        version: VERSION,
        url: POLICY_URL_LOCATION,
        effectiveAt: EFFECTIVE_AT,
    },
];

async function main(): Promise<void> {
    const databaseUrl = process.env['DATABASE_URL'];
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is required');
    }

    // 앱(PrismaService)과 동일한 드라이버 어댑터 방식 — Prisma 7은 url을 명시 주입해야 함.
    const adapter = new PrismaPg({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
    });
    const prisma = new PrismaClient({ adapter });
    try {
        for (const row of seedRows) {
            // 기존 isLatest=true row 가 있으면 false 로 교체한 뒤 새 row 삽입하는 방식 대신,
            // 같은 policyType + version 쌍이 있으면 update, 없으면 create(upsert) 한다.
            // 이미 isLatest=true row 가 다른 버전에 있을 경우에만 해당 row를 false 처리한다.
            await prisma.$transaction(async (tx) => {
                // 동일 policyType 의 기존 is_latest=true row 를 false 처리.
                await tx.policyVersion.updateMany({
                    where: { policyType: row.policyType, isLatest: true },
                    data: { isLatest: false },
                });

                // 같은 policyType + version 이 있으면 update, 없으면 create.
                const existing = await tx.policyVersion.findFirst({
                    where: { policyType: row.policyType, version: row.version },
                });

                if (existing) {
                    await tx.policyVersion.update({
                        where: { id: existing.id },
                        data: { url: row.url, isLatest: true, effectiveAt: row.effectiveAt },
                    });
                    console.log(`[seed-policies] updated: ${row.policyType} ${row.version}`);
                } else {
                    await tx.policyVersion.create({
                        data: {
                            policyType: row.policyType,
                            version: row.version,
                            url: row.url,
                            isLatest: true,
                            effectiveAt: row.effectiveAt,
                        },
                    });
                    console.log(`[seed-policies] created: ${row.policyType} ${row.version}`);
                }
            });
        }
        console.log('[seed-policies] 완료. GET /policies/latest 가 최신 약관 링크를 반환합니다.');
    } finally {
        await prisma.$disconnect();
    }
}

void main();
