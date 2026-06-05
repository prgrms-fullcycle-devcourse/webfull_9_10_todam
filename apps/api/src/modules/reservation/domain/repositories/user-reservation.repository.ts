import { ReservationDeliveryMethod, ReservationStatus } from '@prisma/client';

export interface CreateCustomerReservationInput {
    programId: string;
    slotId: string;
    reserverName: string;
    reserverPhone: string;
    participantCount: number;
    deliveryMethod?: ReservationDeliveryMethod;
    requestMemo?: string;
}

export interface CreateCustomerReservationResult {
    reservation: {
        id: string;
        programId: string;
        storeTimeSlotId: string;
        reserverName: string;
        participantCount: number;
        status: ReservationStatus;
        createdAt: Date;
    };
}

export abstract class UserReservationRepository {
    abstract createCustomer(
        userId: string,
        input: CreateCustomerReservationInput,
    ): Promise<CreateCustomerReservationResult>;
}
