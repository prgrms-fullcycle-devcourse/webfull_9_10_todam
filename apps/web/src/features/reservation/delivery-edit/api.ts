import type { DeliveryEditRequest, DeliveryEditResult } from '@todam/shared';

import { apiFetch } from '../../../shared/api';

const BASE = '/api/v1';

// 배송 정보 등록/수정.
// contract: docs/exec-plans/active/유저 예약 - 나의 배송 정보 수정.md
// PATCH /reservations/{reservationId}/delivery
export function updateReservationDelivery(reservationId: string, body: DeliveryEditRequest) {
    return apiFetch<DeliveryEditResult>(`${BASE}/reservations/${reservationId}/delivery`, {
        method: 'PATCH',
        body,
    });
}
