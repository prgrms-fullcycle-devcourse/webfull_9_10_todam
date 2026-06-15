import type {
    GetMyProfileResponse,
    UpdateMyProfileBody,
    UpdateMyProfileResponse,
    WithdrawBody,
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

// DELETE /users/me — 회원 탈퇴
// contract: docs/exec-plans/active/마이 - 회원탈퇴.md
// 이메일 유저: body { password }. 소셜 유저: 빈 body 객체({}).
export function withdrawAccount(body?: WithdrawBody) {
    return clientApiFetch<null>('/users/me', {
        method: 'DELETE',
        body: body ?? {},
    });
}
