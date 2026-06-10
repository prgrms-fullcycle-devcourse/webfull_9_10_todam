'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { useMyReservations } from '@/features/reservation/list';
import { ApiError } from '@/shared/api';
import { EmptyState } from '@/shared/ui';

import { ReservationCard } from './ReservationCard';

// 클라이언트 동작(react-query / IntersectionObserver) 캡슐화.
// page.tsx 는 서버 컴포넌트로 두고 본 클라이언트 컴포넌트만 렌더.
// 401 은 AuthProvider 전역 핸들러가 "로그인이 필요해요" 모달로 처리(화면별 리다이렉트 금지).
export function ReservationsListClient() {
    const router = useRouter();
    const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
        useMyReservations();

    // 무한 스크롤: 리스트 하단 sentinel 이 뷰포트에 진입하면 다음 페이지 요청.
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        if (!hasNextPage || isFetchingNextPage) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    void fetchNextPage();
                }
            },
            { rootMargin: '120px 0px 0px 0px' },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const items = data?.pages.flatMap((p) => p.reservations) ?? [];
    const isEmpty = !isLoading && !isError && items.length === 0;
    // 401 은 전역 로그인 모달이 안내하므로 네트워크 에러 메시지 분기에서 제외.
    const isNetworkError = isError && !(error instanceof ApiError && error.statusCode === 401);

    return (
        <main className="flex-1 overflow-y-auto px-4 pb-16">
            {isLoading && (
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    예약 목록을 불러오는 중입니다.
                </p>
            )}

            {isNetworkError && (
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    예약 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                </p>
            )}

            {isEmpty && <EmptyState message="아직 예약 내역이 없습니다." />}

            {items.length > 0 && (
                <section className="flex flex-col gap-2.5 py-2">
                    {items.map((item) => (
                        <ReservationCard
                            key={item.id}
                            item={item}
                            onClick={() => router.push(`/my/reservations/${item.id}`)}
                        />
                    ))}
                    <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
                    {isFetchingNextPage && (
                        <p className="py-3 text-center text-xs text-foreground-tertiary">
                            불러오는 중입니다.
                        </p>
                    )}
                </section>
            )}
        </main>
    );
}
