'use client';

import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/login';
import { getMyReservations } from '@/features/reservation/list';
import { ApiError } from '@/shared/api';

// 최근 예약 1건 조회 훅 (메인 화면 위젯용).
// contract: docs/exec-plans/active/최근 예약 조회.md
// GET /reservations/me?limit=1 → reservations[0] ?? null.
// 비인증 사용자: 쿼리를 호출하지 않고(guest) emptyState 노출. 메인은 공개 화면이라
// 전역 401 핸들러(로그인 모달/리다이렉트)가 떠선 안 되므로 API 자체를 호출하지 않는다.
export type RecentReservationState =
    | { kind: 'loading' }
    | { kind: 'guest' } // 비인증(미로그인)
    | { kind: 'empty' } // 인증 사용자, 예약 내역 없음
    | { kind: 'error' } // 500/네트워크
    | {
          kind: 'data';
          item: NonNullable<Awaited<ReturnType<typeof getMyReservations>>['reservations'][0]>;
      };

export function useRecentReservation() {
    // 인증 상태 기반 게이트 (BottomNav와 동일 패턴). 비인증이면 쿼리 미실행 → 401/모달 회피.
    const isAuthenticated = useAuthStore((s) => s.state === 'AUTHENTICATED');

    const { data, isLoading, isError } = useQuery({
        queryKey: ['reservations', 'me', 'recent'] as const,
        queryFn: async () => {
            try {
                return await getMyReservations({ limit: 1 });
            } catch (err) {
                // 방어: 인증 상태였으나 토큰 만료 등으로 401 → guest 로 처리(throw 아닌 정상값).
                if (err instanceof ApiError && err.statusCode === 401) {
                    return null;
                }
                throw err;
            }
        },
        enabled: isAuthenticated,
        staleTime: 30_000,
    });

    const state = (): RecentReservationState => {
        // 비인증 → API 미호출, 즉시 guest emptyState.
        if (!isAuthenticated) return { kind: 'guest' };
        if (isLoading) return { kind: 'loading' };
        if (isError) return { kind: 'error' };
        if (data === null) return { kind: 'guest' };
        if (!data || data.reservations.length === 0) return { kind: 'empty' };
        return { kind: 'data', item: data.reservations[0]! };
    };

    return state();
}
