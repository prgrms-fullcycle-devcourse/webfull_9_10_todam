import type { DeliveryEditRequest, DeliveryEditResult } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

// BE global prefix 없음. 실 경로 = /reservations/:reservationId/delivery.
// contract: docs/exec-plans/active/유저 예약 - 나의 배송 정보 수정.md
// PATCH /reservations/{reservationId}/delivery
export function updateReservationDelivery(reservationId: string, body: DeliveryEditRequest) {
    return clientApiFetch<DeliveryEditResult>(`/reservations/${reservationId}/delivery`, {
        method: 'PATCH',
        body,
    });
}
