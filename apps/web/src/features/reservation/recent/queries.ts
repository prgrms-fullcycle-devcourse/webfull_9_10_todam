'use client';

import { useQuery } from '@tanstack/react-query';

import { getMyReservations } from '@/features/reservation/list';
import { ApiError } from '@/shared/api';

// 최근 예약 1건 조회 훅 (메인 화면 위젯용).
// contract: docs/exec-plans/active/최근 예약 조회.md
// GET /reservations/me?limit=1 → reservations[0] ?? null.
// 메인은 공개 화면이라 비인증/만료 401 에 전역 로그인 모달이 떠선 안 됨 →
// skipAuthErrorHandler 로 전역 핸들러를 우회하고 401 을 자체적으로 guest 로 처리.
// (렌더에서 인증 상태를 읽지 않으므로 SSR 하이드레이션 불일치도 없음.)
export type RecentReservationState =
    | { kind: 'loading' }
    | { kind: 'guest' } // 비인증(미로그인) 또는 토큰 만료 → 401
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
                // 전역 401 핸들러 우회 — 이 위젯이 401 을 직접 guest 로 처리.
                return await getMyReservations({ limit: 1 }, { skipAuthErrorHandler: true });
            } catch (err) {
                if (err instanceof ApiError && err.statusCode === 401) {
                    // 비인증/만료 → null 마커 반환 (throw 아닌 정상값) → guest
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
