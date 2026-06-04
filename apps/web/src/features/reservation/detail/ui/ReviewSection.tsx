'use client';

import { useRouter } from 'next/navigation';

import { EditIcon, Rating, SectionTitle } from '@todam/ui';
import type { ReservationDetail } from '@todam/shared';

import { useReservationReview } from '../queries';

// 디자인 정본 (변형 B/C) — 리뷰 섹션.
// 빈 상태 (변형 B): "아직 작성한 리뷰가 없어요" + "리뷰 쓰기" 버튼
// 작성됨 (변형 C): ReviewItem(`8066:3378` state=full) — IMG 썸네일 + Rating + content
// 리뷰 상세는 D4 가정 endpoint(`GET /reservations/{id}/review`) — BE 채택 패턴 결정 대기.
export type ReviewSectionProps = {
    reservation: ReservationDetail;
};

export function ReviewSection({ reservation }: ReviewSectionProps) {
    const router = useRouter();
    const { data, isLoading } = useReservationReview(reservation.id, reservation.hasReview);

    const handleWriteReview = () => {
        router.push(`/my/reservations/${reservation.id}/review/write`);
    };

    const handleEditReview = () => {
        router.push(`/my/reservations/${reservation.id}/review/edit`);
    };

    // D4: 카드 전체 클릭 → 리뷰 상세 화면 라우팅.
    const handleViewReview = () => {
        router.push(`/my/reservations/${reservation.id}/review`);
    };

    return (
        <section className="flex w-full flex-col gap-2">
            {reservation.hasReview ? (
                <div className="flex w-full items-center justify-between py-2">
                    <span className="text-lg font-semibold text-foreground">리뷰</span>
                    <button
                        type="button"
                        onClick={handleEditReview}
                        className="flex items-center gap-1 text-xs text-foreground-tertiary"
                    >
                        <EditIcon size={16} />
                        수정하기
                    </button>
                </div>
            ) : (
                <SectionTitle title="리뷰" size="md" />
            )}

            {!reservation.hasReview ? (
                // 빈 상태 — DescriptionBlock 패턴.
                <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-border p-4">
                    <p className="text-xs text-foreground-tertiary">아직 작성한 리뷰가 없어요</p>
                    <button
                        type="button"
                        onClick={handleWriteReview}
                        className="text-xs font-semibold text-foreground-tertiary"
                    >
                        리뷰 쓰기
                    </button>
                </div>
            ) : isLoading ? (
                <p className="py-2 text-center text-xs text-foreground-tertiary">
                    리뷰를 불러오는 중입니다.
                </p>
            ) : data ? (
                <button
                    type="button"
                    onClick={handleViewReview}
                    className="flex w-full items-start gap-3 rounded-2xl border border-border-subtle bg-surface p-3 text-left"
                >
                    {data.review.photos[0] ? (
                        <img
                            src={data.review.photos[0].imageUrl}
                            alt="리뷰 사진"
                            className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        />
                    ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <span className="text-[10px] font-medium leading-[15px] text-foreground-secondary">
                                IMG
                            </span>
                        </div>
                    )}
                    <div className="flex flex-1 flex-col gap-2">
                        <Rating scope={data.review.rating} />
                        <p className="line-clamp-2 text-xs text-foreground">
                            {data.review.content}
                        </p>
                    </div>
                </button>
            ) : (
                <p className="py-2 text-center text-xs text-foreground-tertiary">
                    리뷰 정보를 불러오지 못했습니다.
                </p>
            )}
        </section>
    );
}
