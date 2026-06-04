'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import type { ReviewImageUploadRequest, ReviewWriteRequest } from '@todam/shared';

import { ApiError } from '@/shared/api';
import { useToast } from '@/shared/model';

import { createReview, updateReview, uploadReviewImage } from './api';

// 작성/수정 성공 후 공통 invalidate — 예약 상세 + 리뷰 키 (자매 plan useDeleteReviewMutation 정합).
function invalidateReview(qc: ReturnType<typeof useQueryClient>, reservationId: string) {
    qc.invalidateQueries({ queryKey: ['reservations', 'detail', reservationId] });
    qc.invalidateQueries({ queryKey: ['reservations', 'review', reservationId] });
}

// 작성/수정 공통 에러 토스트 분기. 401 → /login.
function handleWriteError(
    error: unknown,
    router: ReturnType<typeof useRouter>,
    push: (t: { message: string }) => unknown,
    fallback: string,
) {
    if (error instanceof ApiError) {
        if (error.statusCode === 401) {
            router.replace('/login');
            return;
        }
        // contract 메시지를 그대로 노출(봉투 message). 없으면 fallback.
        push({ message: error.message || fallback });
        // 이미 작성한 예약(409) → 작성 화면에서 빠져나가 상세 복귀.
        if (error.statusCode === 409) router.back();
        return;
    }
    push({ message: fallback });
}

// 리뷰 작성 mutation. 최종 body(photos = key[])를 받아 POST.
// onSuccess: 토스트 + invalidate + router.back() (예약 상세 복귀, plan §A-5).
export function useCreateReviewMutation(reservationId: string) {
    const qc = useQueryClient();
    const router = useRouter();
    const { push } = useToast();

    return useMutation({
        mutationFn: (body: ReviewWriteRequest) => createReview(reservationId, body),
        onSuccess: () => {
            push({ message: '리뷰가 등록되었어요.' });
            invalidateReview(qc, reservationId);
            router.back();
        },
        onError: (error) =>
            handleWriteError(
                error,
                router,
                push,
                '리뷰 등록 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
            ),
    });
}

// 리뷰 수정 mutation. PATCH 응답 shape(D15)에 의존하지 않고 invalidate+GET 재조회로 갱신.
// onSuccess: 토스트 + invalidate + router.back() (리뷰 상세 복귀, plan §B-5).
export function useUpdateReviewMutation(reviewId: string, reservationId: string) {
    const qc = useQueryClient();
    const router = useRouter();
    const { push } = useToast();

    return useMutation({
        mutationFn: (body: ReviewWriteRequest) => updateReview(reviewId, body),
        onSuccess: () => {
            push({ message: '리뷰가 수정되었어요.' });
            invalidateReview(qc, reservationId);
            router.back();
        },
        onError: (error) =>
            handleWriteError(
                error,
                router,
                push,
                '리뷰 수정 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
            ),
    });
}

// 리뷰 사진 presigned 발급 mutation. 폼이 제출 시점에 pendingImages 별로 호출.
export function useUploadReviewImage() {
    return useMutation({
        mutationFn: (req: ReviewImageUploadRequest) => uploadReviewImage(req),
    });
}
