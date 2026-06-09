import {
    ArtworkStatus,
    ReservationDeliveryMethod,
    ReservationSource,
    ReservationStatus,
} from '@prisma/client';

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

/** GET /reservations/me 목록 조회용 행 */
export interface UserReservationListRow {
    id: string;
    storeName: string;
    programTitle: string;
    scheduledAt: Date;
    participantCount: number;
    status: ReservationStatus;
    /** IN_PROGRESS 구간 displayState 계산에 사용. Artwork 없으면 null */
    artworkStatus: ArtworkStatus | null;
    createdAt: Date;
}

export interface UserReservationListQuery {
    status?: ReservationStatus;
    cursor?: string;
    limit: number;
}

/** GET /reservations/:reservationId 상세 조회용 행 */
export interface UserReservationDetailRow {
    id: string;
    userId: string | null;
    storeId: string;
    storeName: string;
    /** Store.cancelDeadlineDays 원본 (null 허용) */
    cancelDeadlineDays: number | null;
    programId: string;
    programTitle: string;
    /** ProgramSnapshot.price */
    programSnapshotPrice: number;
    scheduledAt: Date;
    reserverName: string;
    reserverPhone: string;
    participantCount: number;
    deliveryMethod: ReservationDeliveryMethod;
    shippingAddress: string | null;
    requestMemo: string | null;
    status: ReservationStatus;
    source: ReservationSource;
    artworkId: string | null;
    artworkStatus: ArtworkStatus | null;
    createdAt: Date;
    delivery: {
        recipientName: string | null;
        recipientPhone: string | null;
        shippingAddress: string | null;
        addressDetail: string | null;
        carrier: string | null;
        trackingNumber: string | null;
    } | null;
    review: { id: string } | null;
}

export abstract class UserReservationRepository {
    abstract createCustomer(
        userId: string,
        input: CreateCustomerReservationInput,
    ): Promise<CreateCustomerReservationResult>;

    abstract findMyList(
        userId: string,
        query: UserReservationListQuery,
    ): Promise<UserReservationListRow[]>;

    abstract findDetail(reservationId: string): Promise<UserReservationDetailRow | null>;
}
