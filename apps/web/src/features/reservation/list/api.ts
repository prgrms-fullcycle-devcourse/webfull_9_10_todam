import { ReservationStatus, type ReservationListResult } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

export type GetMyReservationsParams = {
    status?: ReservationStatus;
    cursor?: string | null;
    limit?: number;
};

// 나의 예약 목록 조회 (커서 페이지네이션).
// contract: docs/exec-plans/active/user-예약-나의 예약조회.md
// GET /reservations/me?status=&cursor=&limit=
// prefix 없이 경로 전달 → clientApiFetch.resolveUrl 이 실모드에서 /api/proxy/reservations/me 로 변환 →
// Next.js proxy → API_BASE_URL/reservations/me (BE global prefix 없음, @Controller() 직접 매핑).
export function getMyReservations(
    { status, cursor, limit }: GetMyReservationsParams = {},
    // 공개 화면의 선택적 인증 호출(예: 메인 최근 예약 위젯)에서 401 자체 처리 시 사용.
    options: { skipAuthErrorHandler?: boolean } = {},
) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (cursor) params.set('cursor', cursor);
    if (typeof limit === 'number') params.set('limit', String(limit));
    const qs = params.toString();
    return clientApiFetch<ReservationListResult>(`/reservations/me${qs ? `?${qs}` : ''}`, {
        method: 'GET',
        skipAuthErrorHandler: options.skipAuthErrorHandler,
    });
}
