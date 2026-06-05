import {
    ArtworkStatus,
    ReservationDeliveryMethod,
    ReservationSource,
    ReservationStatus,
    StoreTimeSlotStatus,
} from '@prisma/client';

export interface PartnerReservationCalendarData {
    reservations: Array<{ scheduledAt: Date }>;
    slots: Array<{ startAt: Date; status: StoreTimeSlotStatus; reservedCount: number }>;
    restrictions: Array<{ startAt: Date }>;
}

export interface PartnerReservationListQuery {
    range: { start: Date; end: Date };
    status?: ReservationStatus;
    programId?: string;
    cursor?: string;
    limit: number;
}

export interface PartnerReservationListRow {
    id: string;
    scheduledAt: Date;
    reserverName: string;
    participantCount: number;
    status: ReservationStatus;
    source: ReservationSource;
    createdAt: Date;
    programTitle: string;
}

export interface PartnerReservationDetailRow {
    id: string;
    status: ReservationStatus;
    scheduledAt: Date;
    participantCount: number;
    reserverName: string;
    reserverPhone: string;
    internalMemo: string | null;
    canceledAt: Date | null;
    cancelReason: string | null;
    createdAt: Date;
    artworkId: string | null;
    programTitle: string;
    partnerUserId: string;
}

export interface PartnerReservationActionRow {
    id: string;
    storeId: string;
    storeTimeSlotId: string;
    status: ReservationStatus;
    scheduledAt: Date;
    participantCount: number;
    artwork: { id: string; status: ArtworkStatus } | null;
    programTitle: string;
    partnerUserId: string;
}

export interface CreateManualReservationInput {
    programId: string;
    slotId: string;
    reserverName: string;
    reserverPhone: string;
    participantCount: number;
    deliveryMethod?: ReservationDeliveryMethod;
    initialStatus: 'CONFIRMED' | 'IN_PROGRESS';
    internalMemo?: string;
}

export interface CreateManualReservationResult {
    reservation: {
        id: string;
        reserverName: string;
        status: ReservationStatus;
        source: ReservationSource;
        createdAt: Date;
    };
    artwork: { id: string };
}

export interface ConfirmReservationResult {
    reservation: { id: string; status: ReservationStatus; updatedAt: Date };
    artwork: { id: string; status: ArtworkStatus };
}

export interface RejectReservationResult {
    id: string;
    status: ReservationStatus;
    updatedAt: Date;
}

export interface CancelReservationResult {
    id: string;
    status: ReservationStatus;
    canceledBy: string | null;
    cancelReason: string | null;
    canceledAt: Date | null;
}

export interface CompleteReservationResult {
    reservation: { id: string; status: ReservationStatus; updatedAt: Date };
    artwork: { status: ArtworkStatus };
}

export abstract class PartnerReservationRepository {
    abstract findCalendarData(
        storeId: string,
        range: { start: Date; end: Date },
    ): Promise<PartnerReservationCalendarData>;

    abstract findList(
        storeId: string,
        query: PartnerReservationListQuery,
    ): Promise<PartnerReservationListRow[]>;

    abstract findDetail(reservationId: string): Promise<PartnerReservationDetailRow | null>;

    abstract createManual(
        storeId: string,
        input: CreateManualReservationInput,
    ): Promise<CreateManualReservationResult | null>;

    abstract findForAction(reservationId: string): Promise<PartnerReservationActionRow | null>;

    abstract confirm(reservation: PartnerReservationActionRow): Promise<ConfirmReservationResult>;

    abstract reject(
        reservation: PartnerReservationActionRow,
        userId: string,
        rejectReason: string | null,
    ): Promise<RejectReservationResult>;

    abstract cancel(
        reservation: PartnerReservationActionRow,
        userId: string,
        cancelReason: string,
    ): Promise<CancelReservationResult>;

    abstract complete(reservation: PartnerReservationActionRow): Promise<CompleteReservationResult>;
}
