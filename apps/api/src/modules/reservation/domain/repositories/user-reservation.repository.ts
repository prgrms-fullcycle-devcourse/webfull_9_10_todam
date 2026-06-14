import {
    ArtworkStatus,
    ReservationDeliveryMethod,
    ReservationSource,
    ReservationStatus,
} from '@prisma/client';

export interface CreateCustomerReservationInput {
    programId: string;
    slotId?: string;
    startAt?: string;
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
    /** 파트너 알림(P-1) 발송에 필요한 파트너 User id. autoConfirm=false(PENDING)인 경우 설정됨 */
    partnerUserId: string | null;
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

/** POST /reservations/:reservationId/cancel 취소 처리용 행 */
export interface UserReservationCancelRow {
    id: string;
    storeId: string;
    userId: string | null;
    status: ReservationStatus;
    source: ReservationSource;
    scheduledAt: Date;
    participantCount: number;
    storeTimeSlotId: string;
    cancelDeadlineDays: number | null;
    artworkId: string | null;
    artworkStatus: ArtworkStatus | null;
    /** 파트너 알림(P-2) 발송에 필요한 파트너 User id */
    partnerUserId: string;
}

/** PATCH /reservations/:reservationId/delivery 가드용 행 */
export interface UserReservationDeliveryGuardRow {
    userId: string | null;
    deliveryMethod: ReservationDeliveryMethod;
    status: ReservationStatus;
}

/** PATCH /reservations/:reservationId/delivery upsert 입력 */
export interface UpsertDeliveryInput {
    recipientName: string;
    recipientPhone: string;
    postalCode: string;
    address: string;
    addressDetail?: string;
}

/** PATCH /reservations/:reservationId/delivery upsert 결과 */
export interface UpsertDeliveryResult {
    recipientName: string;
    recipientPhone: string;
    postalCode: string;
    address: string;
    addressDetail?: string;
}

/** POST /reservations/:reservationId/cancel 취소 결과 */
export interface CancelUserReservationResult {
    id: string;
    /** 취소 후 status는 항상 'CANCELED' 리터럴 (plan §2 contract 명시). */
    status: 'CANCELED';
    canceledBy: string | null;
    cancelReason: string | null;
    canceledAt: Date | null;
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

    abstract findForCancel(reservationId: string): Promise<UserReservationCancelRow | null>;

    abstract cancelReservation(
        row: UserReservationCancelRow,
        userId: string,
    ): Promise<CancelUserReservationResult>;

    abstract findReservationForDelivery(
        reservationId: string,
    ): Promise<UserReservationDeliveryGuardRow | null>;

    abstract upsertDelivery(
        reservationId: string,
        input: UpsertDeliveryInput,
    ): Promise<UpsertDeliveryResult>;
}
