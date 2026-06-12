/**
 * [운영 작업 — 별도 실행] PolicyVersion 초기 시드 스크립트.
 *
 * 배경: GET /policies/latest 가 is_latest=true 인 PolicyVersion row를 반환한다.
 *       가입 전 약관 동의 시트(FE)가 노션 링크를 API에서 동적으로 받아 표시한다.
 *
 * 대상: TERMS_OF_SERVICE / PRIVACY_POLICY / LOCATION_BASED_SERVICE 3종.
 *       MARKETING 은 가입 시트 미노출(별도 처리) → 시드 미포함.
 *
 * ⚠️ URL이 placeholder(notion.so/todam/...로 시작)임.
 *    ops(운영)이 실제 노션 링크 확정 후 아래 PLACEHOLDER_URL_* 값을 교체해야 한다.
 *    교체 후 이 스크립트를 재실행하거나 DB에서 직접 update 한다.
 *
 * 실행 예:
 *   pnpm --filter @todam/api exec tsx prisma/scripts/seed-policies.ts
 *
 * 중복 방지: policyType + version 조합으로 upsert.
 *            같은 버전이 이미 있으면 url/isLatest/effectiveAt 을 덮어쓴다.
 */

import { PrismaClient, PolicyType } from '@prisma/client';

// TODO: ops(운영)이 실제 노션 링크 제공 후 아래 URL을 교체할 것.
const PLACEHOLDER_URL_TERMS =
    'https://clean-crocus-36c.notion.site/37d2ee66b06c80e4af1ae8e2e1f077e3?pvs=74';
const PLACEHOLDER_URL_PRIVACY =
    'https://clean-crocus-36c.notion.site/37d2ee66b06c80498b42c5bf903e36e0';
const PLACEHOLDER_URL_LOCATION =
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
        url: PLACEHOLDER_URL_TERMS,
        effectiveAt: EFFECTIVE_AT,
    },
    {
        policyType: PolicyType.PRIVACY_POLICY,
        version: VERSION,
        url: PLACEHOLDER_URL_PRIVACY,
        effectiveAt: EFFECTIVE_AT,
    },
    {
        policyType: PolicyType.LOCATION_BASED_SERVICE,
        version: VERSION,
        url: PLACEHOLDER_URL_LOCATION,
        effectiveAt: EFFECTIVE_AT,
    },
];

async function main(): Promise<void> {
    const prisma = new PrismaClient();
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
        console.log('[seed-policies] 완료. ops가 실제 노션 링크로 URL을 교체해야 합니다.');
    } finally {
        await prisma.$disconnect();
    }
}

void main();
