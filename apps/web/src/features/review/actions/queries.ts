'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { ApiError } from '@/shared/api';
import { useToast } from '@/shared/model';

import { deleteReview } from './api';

// 리뷰 삭제 mutation.
// onSuccess: 토스트 + 예약 상세/리뷰 query invalidate + router.back() (예약 상세 복귀, D11).
// onError: statusCode 분기 (plan §UI 동작 흐름 B-5).
export function useDeleteReviewMutation(reservationId: string) {
    const qc = useQueryClient();
    const router = useRouter();
    const { push } = useToast();

    return useMutation({
        mutationFn: (reviewId: string) => deleteReview(reviewId),
        onSuccess: () => {
            push({ message: '리뷰가 삭제되었어요.' });
            qc.invalidateQueries({ queryKey: ['reservations', 'detail', reservationId] });
            qc.invalidateQueries({ queryKey: ['reservations', 'review', reservationId] });
            router.back();
        },
        onError: (error) => {
            if (error instanceof ApiError) {
                if (error.statusCode === 401) {
                    router.replace('/login');
                    return;
                }
                if (error.statusCode === 404) {
                    push({ message: '이미 삭제된 리뷰예요.' });
                    router.back();
                    return;
                }
                if (error.statusCode === 403) {
                    push({ message: '권한이 없어요.' });
                    return;
                }
            }
            push({ message: '리뷰 삭제 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' });
        },
    });
}
