import type {
    GetMyProfileResponse,
    UpdateMyProfileBody,
    UpdateMyProfileResponse,
} from '@todam/shared';

import { apiFetch } from '@/shared/api';

const BASE = '/api/v1';

// GET /users/me — 내 프로필 조회 (MSW mock 경로 /api/v1, 실 API 전환 시 root 경로)
// contract: docs/exec-plans/active/마이페이지.md
export function getMyProfile() {
    return apiFetch<GetMyProfileResponse>(`${BASE}/users/me`, { method: 'GET' });
}

// PATCH /users/me — 닉네임 수정
// contract: docs/exec-plans/active/마이페이지.md
export function updateMyProfile(body: UpdateMyProfileBody) {
    return apiFetch<UpdateMyProfileResponse>(`${BASE}/users/me`, {
        method: 'PATCH',
        body,
    });
}
