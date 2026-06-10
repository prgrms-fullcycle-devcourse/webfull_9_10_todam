'use client';

import { useQuery } from '@tanstack/react-query';

import { getMyReservations } from '@/features/reservation/list';
import { ApiError } from '@/shared/api';

// 최근 예약 1건 조회 훅 (메인 화면 위젯용).
// contract: docs/exec-plans/active/최근 예약 조회.md
// GET /reservations/me?limit=1 → reservations[0] ?? null.
// 401(비회원/미인증) → null 로 분기(throw 아닌 정상 반환). 메인은 비회원도 접근 가능.
export type RecentReservationState =
    | { kind: 'loading' }
    | { kind: 'guest' } // 401 비회원
    | { kind: 'empty' } // 인증 사용자, 예약 내역 없음
    | { kind: 'error' } // 500/네트워크
    | {
          kind: 'data';
          item: NonNullable<Awaited<ReturnType<typeof getMyReservations>>['reservations'][0]>;
      };

export function useRecentReservation() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['reservations', 'me', 'recent'] as const,
        queryFn: async () => {
            try {
                return await getMyReservations({ limit: 1 });
            } catch (err) {
                if (err instanceof ApiError && err.statusCode === 401) {
                    // 비회원 → null 마커 반환 (throw 아닌 정상값)
                    return null;
                }
                throw err;
            }
        },
        staleTime: 30_000,
    });

    const state = (): RecentReservationState => {
        if (isLoading) return { kind: 'loading' };
        if (isError) return { kind: 'error' };
        if (data === null) return { kind: 'guest' };
        if (!data || data.reservations.length === 0) return { kind: 'empty' };
        return { kind: 'data', item: data.reservations[0]! };
    };

    return state();
}
