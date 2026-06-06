import type {
    PartnerProgramDetailResult,
    UpdateProgramStatusRequest,
    UpdateProgramStatusResult,
} from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

const BASE = '/partner';

export function getPartnerProgramDetail(storeId: string, programId: string) {
    return clientApiFetch<PartnerProgramDetailResult>(
        `${BASE}/stores/${encodeURIComponent(storeId)}/programs/${encodeURIComponent(programId)}`,
        { method: 'GET' },
    );
}

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
