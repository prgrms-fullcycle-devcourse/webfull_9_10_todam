// Prisma row ↔ ReservationRestriction 도메인 엔티티 변환.

import { ReservationRestriction } from '../../domain/entities/reservation-restriction.entity';

export interface ReservationRestrictionRow {
    id: string;
    storeId: string;
    startAt: Date;
    endAt: Date;
    programId: string;
    createdBy: string | null;
    createdAt: Date;
}

export class ReservationRestrictionMapper {
    static toDomain(row: ReservationRestrictionRow): ReservationRestriction {
        return new ReservationRestriction(
            row.id,
            row.storeId,
            row.startAt,
            row.endAt,
            row.programId,
            row.createdBy,
            row.createdAt,
        );
    }
}
