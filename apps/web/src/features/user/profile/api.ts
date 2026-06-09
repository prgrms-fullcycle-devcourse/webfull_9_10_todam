import type {
    GetMyProfileResponse,
    UpdateMyProfileBody,
    UpdateMyProfileResponse,
} from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

// GET /users/me — 내 프로필 조회
// contract: docs/exec-plans/active/마이페이지.md
export function getMyProfile() {
    return clientApiFetch<GetMyProfileResponse>('/users/me', { method: 'GET' });
}

// PATCH /users/me — 닉네임 수정
// contract: docs/exec-plans/active/마이페이지.md
export function updateMyProfile(body: UpdateMyProfileBody) {
    return clientApiFetch<UpdateMyProfileResponse>('/users/me', {
        method: 'PATCH',
        body,
    });
}
