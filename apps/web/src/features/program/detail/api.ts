import type { ProgramDifficulty, ProgramStatus } from '@todam/shared';

import { apiFetch } from '@/shared/api';

const BASE = '/partner';

// 파트너 클래스 상세 응답 뷰.
// 퍼블릭 ProgramDetail(shared)과 달리 이미지가 { imageUrl, thumbnailUrl|null }만 내려온다(Contract #1).
export type PartnerProgramDetailImageView = {
    imageUrl: string;
    thumbnailUrl: string | null;
};

export type PartnerProgramDetailView = {
    id: string;
    storeId: string;
    title: string;
    description: string | null;
    materials: string | null;
    caution: string | null;
    price: number;
    durationMinutes: number;
    leadTimeDays: number;
    deliverable: boolean;
    childFriendly: boolean;
    difficulty: ProgramDifficulty;
    status: ProgramStatus;
    images: PartnerProgramDetailImageView[];
};

export type PartnerProgramDetailResultView = {
    program: PartnerProgramDetailView;
};

// 파트너 클래스 상세 조회 (DRAFT·INACTIVE·ACTIVE 전체 상태).
// GET /partner/stores/{storeId}/programs/{programId} (AuthGuard, PartnerGuard)
export function getPartnerProgramDetail(storeId: string, programId: string) {
    return apiFetch<PartnerProgramDetailResultView>(
        `${BASE}/stores/${encodeURIComponent(storeId)}/programs/${encodeURIComponent(programId)}`,
        { method: 'GET' },
    );
}
