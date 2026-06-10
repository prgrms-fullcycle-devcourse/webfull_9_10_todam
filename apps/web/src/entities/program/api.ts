import type {
    PartnerProgramDetailResult,
    ProgramDetailResult,
    ProgramReviewListResult,
    ProgramReviewSort,
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

export function getPublicProgramDetail(programId: string) {
    return clientApiFetch<ProgramDetailResult>(`/programs/${encodeURIComponent(programId)}`, {
        method: 'GET',
    });
}

export type GetProgramReviewsParams = {
    page?: number;
    limit?: number;
    sort?: ProgramReviewSort;
};

export function getProgramReviews(programId: string, params: GetProgramReviewsParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set('page', String(params.page));
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params.sort !== undefined) searchParams.set('sort', params.sort);
    const qs = searchParams.toString();

    return clientApiFetch<ProgramReviewListResult>(
        `/programs/${encodeURIComponent(programId)}/reviews${qs ? `?${qs}` : ''}`,
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
