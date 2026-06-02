'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button, MoreIcon } from '@todam/ui';

import { ReviewDetailContent } from '../../../../entities/review';
import { useReservationDetail, useReservationReview } from '../../../reservation/detail';
import { useDeleteReviewMutation } from '../../actions';
import { ApiError } from '../../../../shared/api';
import { useHeaderActionStore, useModal, useToast } from '../../../../shared/model';

import { DeleteReviewDialog } from './DeleteReviewDialog';
import { ReviewMoreMenu } from './ReviewMoreMenu';

// 리뷰 상세 클라이언트.
// - react-query useReservationReview (상세 화면이므로 enabled=true)
// - 작품 정보 헤더용 useReservationDetail 병행 호출
// - 401 → /login 리다이렉트 / 403·404 → 안내 메시지
// - 헤더 우측 more 액션 슬롯에 토글 버튼 등록 (useHeaderActionStore)
// - more 클릭 → ReviewMoreMenu 노출, "삭제하기" → DeleteReviewDialog
export type ReviewDetailClientProps = {
    reservationId: string;
};

export function ReviewDetailClient({ reservationId }: ReviewDetailClientProps) {
    const router = useRouter();
    const { data, error, isLoading, isError } = useReservationReview(reservationId, true);
    const { data: reservationData } = useReservationDetail(reservationId);
    const { open: openModal, close: closeModal } = useModal();
    const { push: pushToast } = useToast();
    const setHeaderAction = useHeaderActionStore((s) => s.setAction);
    const clearHeaderAction = useHeaderActionStore((s) => s.clearAction);
    const { mutate: deleteReviewMutate } = useDeleteReviewMutation(reservationId);

    const [menuOpen, setMenuOpen] = useState(false);

    // 401 → /login 리다이렉트.
    useEffect(() => {
        if (isError && error instanceof ApiError && error.statusCode === 401) {
            router.replace('/login');
        }
    }, [isError, error, router]);

    const review = data?.review;
    const reservation = reservationData?.reservation;

    const handleEdit = () => {
        pushToast({ message: '리뷰 수정은 곧 지원돼요.' });
    };

    const handleDelete = () => {
        if (!review) return;
        openModal(
            <DeleteReviewDialog
                onConfirm={() => deleteReviewMutate(review.id)}
                onClose={closeModal}
            />,
        );
    };

    // 헤더 우측 more 버튼 등록 / 해제 — 리뷰 데이터 있을 때만.
    useEffect(() => {
        if (!review) {
            clearHeaderAction();
            return () => clearHeaderAction();
        }
        setHeaderAction(
            <Button
                variant="ghost"
                layout="onlyIcon"
                size="lg"
                icon={<MoreIcon />}
                aria-label="더보기"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="hover:!bg-transparent hover:!text-foreground"
            />,
        );
        return () => clearHeaderAction();
    }, [review, setHeaderAction, clearHeaderAction]);

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
        <main className="relative flex-1 overflow-y-auto px-4 pb-16">
            <div className="py-2">
                <ReviewDetailContent review={review} reservation={reservation} />
            </div>

            {/* 더보기 floating menu — header more 버튼 클릭 시 토글. */}
            {menuOpen && (
                <>
                    <button
                        type="button"
                        aria-label="메뉴 닫기"
                        className="absolute inset-0"
                        onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-4 top-2 z-10">
                        <ReviewMoreMenu
                            createdAt={review.createdAt}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onClose={() => setMenuOpen(false)}
                        />
                    </div>
                </>
            )}
        </main>
    );
}
