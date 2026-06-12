// API Contract 바인딩: docs/exec-plans/active/admin.md ## API Contract (스냅샷)
// 엔드포인트/스키마/필드명은 @todam/shared contract(SSOT) 그대로. 임의 변경 금지.

import type {
    AdminStoreActionResponse,
    AdminStoreDetailResponse,
    AdminStoreListQuery,
    AdminStoreListResponse,
    AdminStoreRejectRequest,
    AdminStoreSuspendRequest,
} from '@todam/shared';

import { adminApiFetch } from '@/shared/api';

export type {
    AdminStoreActionResponse,
    AdminStoreDetailResponse,
    AdminStoreListItem,
    AdminStoreListQuery,
    AdminStoreListResponse,
} from '@todam/shared';

// GET /admin/stores?status&page&limit&q
// res 200: { data: { stores, pagination } }
export function getAdminStoreList(
    query: Partial<AdminStoreListQuery>,
): Promise<AdminStoreListResponse> {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.q) params.set('q', query.q);

    const qs = params.toString();
    return adminApiFetch<AdminStoreListResponse>(`/admin/stores${qs ? `?${qs}` : ''}`);
}

// GET /admin/stores/:storeId
// res 200: { data: { store, businessDocument, partner } }
export function getAdminStoreDetail(storeId: string): Promise<AdminStoreDetailResponse> {
    return adminApiFetch<AdminStoreDetailResponse>(`/admin/stores/${storeId}`);
}

// PATCH /admin/stores/:storeId/approve  (PENDING → PUBLISHED)
export function approveAdminStore(storeId: string): Promise<AdminStoreActionResponse> {
    return adminApiFetch<AdminStoreActionResponse>(`/admin/stores/${storeId}/approve`, {
        method: 'PATCH',
    });
}

// PATCH /admin/stores/:storeId/reject  (PENDING → REJECTED, rejectedReason 필수)
export function rejectAdminStore(
    storeId: string,
    body: AdminStoreRejectRequest,
): Promise<AdminStoreActionResponse> {
    return adminApiFetch<AdminStoreActionResponse>(`/admin/stores/${storeId}/reject`, {
        method: 'PATCH',
        body,
    });
}

// PATCH /admin/stores/:storeId/suspend  (PUBLISHED → SUSPENDED, suspendedReason 필수)
export function suspendAdminStore(
    storeId: string,
    body: AdminStoreSuspendRequest,
): Promise<AdminStoreActionResponse> {
    return adminApiFetch<AdminStoreActionResponse>(`/admin/stores/${storeId}/suspend`, {
        method: 'PATCH',
        body,
    });
}

// PATCH /admin/stores/:storeId/restore  (SUSPENDED → PUBLISHED)
export function restoreAdminStore(storeId: string): Promise<AdminStoreActionResponse> {
    return adminApiFetch<AdminStoreActionResponse>(`/admin/stores/${storeId}/restore`, {
        method: 'PATCH',
    });
}
