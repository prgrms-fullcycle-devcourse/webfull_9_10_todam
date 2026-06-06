import type {
    PartnerProgramDetailResult,
    UpdateProgramStatusRequest,
    UpdateProgramStatusResult,
} from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

const BASE = '/partner';

// 파트너 클래스 상세 조회 (DRAFT·INACTIVE·ACTIVE 전체 상태).
export function getPartnerProgramDetail(storeId: string, programId: string) {
    return clientApiFetch<PartnerProgramDetailResult>(
        `${BASE}/stores/${encodeURIComponent(storeId)}/programs/${encodeURIComponent(programId)}`,
        { method: 'GET' },
    );
}

// 클래스 게시 상태 변경 (게시중단 ACTIVE→INACTIVE, 게시 INACTIVE/DRAFT→ACTIVE).
export function updateProgramStatus(
    storeId: string,
    programId: string,
    body: UpdateProgramStatusRequest,
) {
    return clientApiFetch<UpdateProgramStatusResult>(
        `${BASE}/stores/${encodeURIComponent(storeId)}/programs/${encodeURIComponent(programId)}/status`,
        { method: 'PATCH', body },
    );
}
