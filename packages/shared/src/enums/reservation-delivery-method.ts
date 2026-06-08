// ReservationStatus 와 동일하게 const-union 으로 둔다. Prisma 가 생성하는 동일 enum 값을
// 그대로 할당할 수 있어(=문자열 union), 예약 응답 DTO 를 createZodDto(zod) 로 통합할 때
// Prisma row → shared 타입 간 nominal enum 충돌이 발생하지 않는다.
export const ReservationDeliveryMethod = {
    DELIVERY: 'DELIVERY',
    PICKUP: 'PICKUP',
} as const;

export type ReservationDeliveryMethod =
    (typeof ReservationDeliveryMethod)[keyof typeof ReservationDeliveryMethod];
