/**
 * [운영 작업 — 별도 실행] Store.regionSido/Sigungu/Dong 백필 스크립트 골격.
 *
 * 배경: GET /stores 응답의 region 객체({sido,sigungu,dong})는 저장된 구조화 컬럼을
 *       그대로 반환한다(조회당 외부 API 호출 0). 신규 컬럼은 마이그레이션으로 추가되었으나,
 *       기존 공방 데이터는 region 값이 비어 있다 → 이 스크립트로 1회 백필한다.
 *
 * 방식: latitude/longitude 가 있고 region* 가 비어 있는 Store 를 대상으로
 *       카카오 coord2regioncode(geo/coord2regioncode.json) 를 호출해 시·구·동을 채운다.
 *
 * ⚠️ 아직 미구현(골격만). 실제 운영 전 아래 TODO 를 완성한 뒤 단독 실행할 것.
 *   - KAKAO_REST_API_KEY 환경변수 주입
 *   - 카카오 쿼터/레이트리밋 대응(배치·딜레이·재시도)
 *   - 시도명 약어 규칙 확정(예: "서울특별시" → "서울"), region depth 정리
 *   - 좌표 없는 공방 처리 정책(스킵/로그)
 *
 * 실행 예: pnpm --filter @todam/api exec tsx prisma/scripts/backfill-store-region.ts
 */
import { PrismaClient } from '@prisma/client';

const KAKAO_COORD2REGION_URL = 'https://dapi.kakao.com/v2/local/geo/coord2regioncode.json';

interface RegionParts {
    sido: string | null;
    sigungu: string | null;
    dong: string | null;
}

// TODO: 카카오 응답(region_type 'H' 행정동 우선) → {sido,sigungu,dong} 매핑 + 시도명 약어 정리.
async function resolveRegion(_lat: number, _lng: number): Promise<RegionParts> {
    const apiKey = process.env.KAKAO_REST_API_KEY;
    if (!apiKey) {
        throw new Error('KAKAO_REST_API_KEY 가 필요합니다.');
    }
    // const res = await fetch(`${KAKAO_COORD2REGION_URL}?x=${_lng}&y=${_lat}`, {
    //     headers: { Authorization: `KakaoAK ${apiKey}` },
    // });
    // ... region_type 'H' 항목에서 region_1depth_name/2depth/3depth 추출 + 약어 정리
    void KAKAO_COORD2REGION_URL;
    return { sido: null, sigungu: null, dong: null };
}

async function main(): Promise<void> {
    const prisma = new PrismaClient();
    try {
        const targets = await prisma.store.findMany({
            where: {
                latitude: { not: null },
                longitude: { not: null },
                regionDong: null,
            },
            select: { id: true, latitude: true, longitude: true },
        });

        console.warn(`[backfill-store-region] 대상 ${targets.length}건 (골격 — 미구현)`);

        for (const store of targets) {
            const region = await resolveRegion(store.latitude!, store.longitude!);
            if (!region.dong) {
                continue; // TODO: 실패 로깅
            }
            await prisma.store.update({
                where: { id: store.id },
                data: {
                    regionSido: region.sido,
                    regionSigungu: region.sigungu,
                    regionDong: region.dong,
                },
            });
        }
    } finally {
        await prisma.$disconnect();
    }
}

void main();
