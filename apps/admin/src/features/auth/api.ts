// API Contract 바인딩: docs/exec-plans/active/admin.md ## API Contract (스냅샷)
// 엔드포인트/스키마/필드명은 @todam/shared contract(SSOT) 그대로. 임의 변경 금지.

import type { AdminLoginRequest, AdminLoginResponse } from '@todam/shared';

import { adminApiFetch } from '@/shared/api';

export type { AdminLoginRequest, AdminLoginResponse } from '@todam/shared';

// POST /admin/auth/login
// req:  { email, password }
// res 200: { data: { admin, accessToken } }
// err:  401 INVALID_CREDENTIALS / 500 INTERNAL_SERVER_ERROR
export function adminLogin(input: AdminLoginRequest): Promise<AdminLoginResponse> {
    return adminApiFetch<AdminLoginResponse>('/admin/auth/login', {
        method: 'POST',
        body: input,
    });
}
