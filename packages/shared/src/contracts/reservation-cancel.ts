import { z } from 'zod';

// ─── 유저 예약 취소 응답 (POST /reservations/{reservationId}/cancel) ──────────
// plan: docs/exec-plans/active/유저 예약 - 예약 취소.md API Contract (스냅샷)
// 요청 바디 없음 — request 스키마 불필요 (O3 확정).
// status는 항상 'CANCELED' 리터럴 (§2 plan contract 명시).

export const cancelReservationResponseSchema = z.object({
    reservation: z.object({
        id: z.string().uuid().meta({ example: 'res-uuid-001' }),
        status: z.literal('CANCELED'),
        canceledBy: z.string().uuid().meta({ example: 'user-uuid-001' }),
        cancelReason: z.null().meta({ example: null }),
        canceledAt: z.string().meta({ example: '2026-05-25T19:50:00.000Z' }),
    }),
});
export type CancelReservationResponse = z.infer<typeof cancelReservationResponseSchema>;

// ─── 에러 코드 ────────────────────────────────────────────────────────────────
export const ReservationCancelErrorCode = {
    CANCELLATION_DEADLINE_EXCEEDED: 'CANCELLATION_DEADLINE_EXCEEDED',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    RESERVATION_NOT_FOUND: 'RESERVATION_NOT_FOUND',
    ALREADY_CANCELED: 'ALREADY_CANCELED',
    INVALID_RESERVATION_STATUS: 'INVALID_RESERVATION_STATUS',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
export type ReservationCancelErrorCode =
    (typeof ReservationCancelErrorCode)[keyof typeof ReservationCancelErrorCode];
