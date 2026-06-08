import type {
    AvailableSlotsResult,
    CreateUserReservationRequest,
    CreateUserReservationResult,
} from '@todam/shared';

import { apiFetch } from '@/shared/api';

// 예약 가능 슬롯 조회.
// contract: docs/exec-plans/active/user-예약-신청.md API Contract (스냅샷)
// GET /programs/{programId}/available-slots?year=&month=
// AuthGuard 필요 — apiFetch 가 토큰 자동 주입.
export function getAvailableSlots(programId: string, year: number, month: number) {
    const params = new URLSearchParams({
        year: String(year),
        month: String(month),
    });
    return apiFetch<AvailableSlotsResult>(
        `/programs/${programId}/available-slots?${params.toString()}`,
        { method: 'GET' },
    );
}

// 유저 예약 생성.
// contract: docs/exec-plans/active/user-예약-신청.md API Contract (스냅샷)
// POST /reservations
// AuthGuard 필요 — apiFetch 가 토큰 자동 주입.
export function createUserReservation(body: CreateUserReservationRequest) {
    return apiFetch<CreateUserReservationResult>('/reservations', {
        method: 'POST',
        body,
    });
}
