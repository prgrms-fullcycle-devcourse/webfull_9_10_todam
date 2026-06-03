'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DeliveryEditRequest } from '@todam/shared';

import { updateReservationDelivery } from './api';

// 예약 상세 캐시 무효화 키 — features/reservation/detail/queries.ts 의 KEY 와 동일.
const RESERVATION_DETAIL_KEY = ['reservations', 'detail'] as const;

// 배송 정보 등록/수정 mutation.
// onSuccess: 예약 상세 캐시 무효화 (운송장/택배사 보존을 위해 setQueryData 부분 머지 대신 invalidate 선택).
export function useUpdateReservationDelivery(reservationId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: DeliveryEditRequest) => updateReservationDelivery(reservationId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [...RESERVATION_DETAIL_KEY, reservationId],
            });
        },
    });
}
