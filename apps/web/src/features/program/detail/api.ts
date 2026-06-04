import type { PartnerProgramDetailResult } from '@todam/shared';

import { apiFetch } from '@/shared/api';

const BASE = '/partner';

// 파트너 클래스 상세 조회 (DRAFT·INACTIVE·ACTIVE 전체 상태).
// GET /partner/stores/{storeId}/programs/{programId} (AuthGuard, PartnerGuard)
// 응답 계약은 shared `partnerProgramDetailResultSchema`(단일 출처) 사용 — 퍼블릭 ProgramDetail과 별개.
export function getPartnerProgramDetail(storeId: string, programId: string) {
    return apiFetch<PartnerProgramDetailResult>(
        `${BASE}/stores/${encodeURIComponent(storeId)}/programs/${encodeURIComponent(programId)}`,
        { method: 'GET' },
    );
}
