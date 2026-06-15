'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Modal } from '@todam/ui';

import { deleteReview, ReviewDetailContent } from '@/entities/review';
import { useReservationDetail, useReservationReview } from '@/entities/reservation';
import { ApiError } from '@/shared/api';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useModal, useToast } from '@/shared/model';

import { ReviewMoreMenu } from './ReviewMoreMenu';

// 리뷰 상세 클라이언트.
// - react-query useReservationReview (상세 화면이므로 enabled=true)
// - 작품 정보 헤더용 useReservationDetail 병행 호출
// - 401 → 전역 인증 에러 핸들러 / 403·404 → 안내 메시지
// - 헤더 우측 more 액션 슬롯에 토글 버튼 등록 (useHeaderActionStore)
// - more 클릭 → ReviewMoreMenu 노출, "삭제하기" → 전역 Modal confirm
export type ReviewDetailClientProps = {
    reservationId: string;
};

export function ReviewDetailClient({ reservationId }: ReviewDetailClientProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data, error, isLoading, isError } = useReservationReview(reservationId, true);
    const { data: reservationData } = useReservationDetail(reservationId);
    const { open: openModal, close: closeModal } = useModal();
    const { push } = useToast();
    const { mutate: deleteReviewMutate } = useMutation({
        mutationFn: (reviewId: string) => deleteReview(reviewId),
        onSuccess: () => {
            push({ message: '리뷰가 삭제되었어요.' });
            queryClient.invalidateQueries({ queryKey: ['reservations', 'detail', reservationId] });
            queryClient.invalidateQueries({ queryKey: ['reservations', 'review', reservationId] });
            router.back();
        },
        onError: (mutationError) => {
            if (mutationError instanceof ApiError) {
                if (mutationError.statusCode === 401) return;
                if (mutationError.statusCode === 404) {
                    push({ message: '이미 삭제된 리뷰예요.' });
                    router.back();
                    return;
                }
                if (mutationError.statusCode === 403) {
                    push({ message: '권한이 없어요.' });
                    return;
                }
            }
            push({ message: '리뷰 삭제 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' });
        },
    });

    const review = data?.review;
    const reservation = reservationData?.reservation;

    const handleEdit = () => {
        router.push(`/my/reservations/${reservationId}/review/edit`);
    };

    const handleDelete = () => {
        if (!review) return;
        const reviewId = review.id;
        // 리뷰 삭제 confirm — 정적 텍스트라 전역 Modal 직접 사용(Figma `8507:23893`).
        openModal(
            <Modal
                type="shortText"
                title="리뷰를 삭제할까요?"
                description="삭제한 리뷰는 되돌릴 수 없어요."
                cancelLabel="취소"
                confirmLabel="삭제하기"
                danger
                onCancel={closeModal}
                onConfirm={() => {
                    deleteReviewMutate(reviewId);
                    closeModal();
                }}
            />,
        );
    };

    // 라우트 헤더 우측 more 메뉴 — 리뷰 데이터 있을 때만(없으면 기본값 유지).
    useHeaderOverride({
        rightAction: review ? (
            <ReviewMoreMenu
                createdAt={review.createdAt}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        ) : undefined,
    });

    if (isLoading) {
        return (
            <main className="flex-1 overflow-y-auto px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    리뷰를 불러오는 중입니다.
                </p>
            </main>
        );
    }

    if (isError && error instanceof ApiError) {
        // 401 은 리다이렉트 처리 — 메시지 분기에서 제외.
        if (error.statusCode === 401) return null;
        const message =
            error.statusCode === 404
                ? '리뷰를 찾을 수 없습니다.'
                : error.statusCode === 403
                  ? '해당 리뷰에 대한 접근 권한이 없습니다.'
                  : '리뷰 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
        return (
            <main className="flex-1 overflow-y-auto px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">{message}</p>
            </main>
        );
    }

    if (!review) {
        return (
            <main className="flex-1 overflow-y-auto px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    리뷰 정보를 불러오지 못했습니다.
                </p>
            </main>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto px-4 pb-16">
            <div className="py-2">
                <ReviewDetailContent review={review} reservation={reservation} />
            </div>
        </main>
    );
}
