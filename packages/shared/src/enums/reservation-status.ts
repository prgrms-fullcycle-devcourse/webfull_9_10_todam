export const ReservationStatus = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    CANCELED: 'CANCELED',
    IN_PROGRESS: 'IN_PROGRESS',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    PICKUP_READY: 'PICKUP_READY',
    PICKUP_DONE: 'PICKUP_DONE',
} as const;

export type ReservationStatus = (typeof ReservationStatus)[keyof typeof ReservationStatus];
