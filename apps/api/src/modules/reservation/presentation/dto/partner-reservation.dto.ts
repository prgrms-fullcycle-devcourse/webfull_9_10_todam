import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, Min, MaxLength } from 'class-validator';
import { ReservationDeliveryMethod, ReservationStatus } from '@prisma/client';
import type { PartnerReservationAction } from '../../domain/reservation-actions';

const RESERVATION_STATUS_VALUES = Object.values(ReservationStatus);
const DELIVERY_METHOD_VALUES = Object.values(ReservationDeliveryMethod);
const MANUAL_INITIAL_STATUS_VALUES = ['CONFIRMED', 'IN_PROGRESS'] as const;
type ManualInitialStatus = (typeof MANUAL_INITIAL_STATUS_VALUES)[number];

export class PartnerReservationCalendarQueryDto {
    @ApiProperty({ example: 2026 })
    @Type(() => Number)
    @IsInt()
    @Min(1900)
    @Max(9999)
    year!: number;

    @ApiProperty({ example: 6 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    month!: number;
}

export class PartnerReservationCalendarDayDto {
    @ApiProperty() date!: string;
    @ApiProperty() hasReservation!: boolean;
    @ApiProperty() isUnavailable!: boolean;
    @ApiProperty() hasRestriction!: boolean;
    @ApiProperty() reservationCount!: number;
}

export class PartnerReservationCalendarResponseDto {
    @ApiProperty() year!: number;
    @ApiProperty() month!: number;
    @ApiProperty({ type: [PartnerReservationCalendarDayDto] })
    days!: PartnerReservationCalendarDayDto[];
}

export class ListPartnerReservationsQueryDto {
    @ApiProperty({ example: '2026-06-01' })
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    date!: string;

    @ApiPropertyOptional({ enum: RESERVATION_STATUS_VALUES })
    @IsOptional()
    @IsIn(RESERVATION_STATUS_VALUES)
    status?: ReservationStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    programId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    cursor?: string;

    @ApiPropertyOptional({ default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}

export class PartnerReservationListItemDto {
    @ApiProperty() id!: string;
    @ApiProperty() programTitle!: string;
    @ApiProperty() scheduledAt!: string;
    @ApiProperty() reserverName!: string;
    @ApiProperty() participantCount!: number;
    @ApiProperty() status!: string;
    @ApiProperty() source!: string;
    @ApiProperty() createdAt!: string;
}

export class ListPartnerReservationsResponseDto {
    @ApiProperty({ type: [PartnerReservationListItemDto] })
    reservations!: PartnerReservationListItemDto[];
    @ApiProperty({ nullable: true }) nextCursor!: string | null;
    @ApiProperty() hasMore!: boolean;
}

export class PartnerReservationDetailDto {
    @ApiProperty() id!: string;
    @ApiProperty() reservationNumber!: string;
    @ApiProperty() programTitle!: string;
    @ApiProperty() status!: string;
    @ApiProperty() scheduledAt!: string;
    @ApiProperty() participantCount!: number;
    @ApiProperty() reserverName!: string;
    @ApiProperty() reserverPhone!: string;
    @ApiProperty({ nullable: true }) internalMemo!: string | null;
    @ApiProperty({ nullable: true }) canceledAt!: string | null;
    @ApiProperty({ nullable: true }) cancelReason!: string | null;
    @ApiProperty({ nullable: true }) artworkId!: string | null;
    @ApiProperty({ enum: ['CONFIRM', 'REJECT', 'CANCEL', 'COMPLETE'], isArray: true })
    availableActions!: PartnerReservationAction[];
    @ApiProperty() createdAt!: string;
}

export class GetPartnerReservationDetailResponseDto {
    @ApiProperty({ type: PartnerReservationDetailDto })
    reservation!: PartnerReservationDetailDto;
}

export class PartnerReservationStatusResponseDto {
    @ApiProperty({
        type: Object,
        additionalProperties: true,
    })
    reservation!: Record<string, unknown>;
}

export class CancelPartnerReservationDto {
    @ApiProperty()
    @IsString()
    @MaxLength(500)
    cancelReason!: string;
}

export class RejectPartnerReservationDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(500)
    rejectReason?: string;
}

export class CreatePartnerReservationDto {
    @ApiProperty()
    @IsString()
    programId!: string;

    @ApiProperty()
    @IsString()
    slotId!: string;

    @ApiProperty()
    @IsString()
    @MaxLength(100)
    reserverName!: string;

    @ApiProperty()
    @IsString()
    @MaxLength(20)
    reserverPhone!: string;

    @ApiProperty()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    participantCount!: number;

    @ApiPropertyOptional({ enum: DELIVERY_METHOD_VALUES })
    @IsOptional()
    @IsIn(DELIVERY_METHOD_VALUES)
    deliveryMethod?: ReservationDeliveryMethod;

    @ApiProperty({ enum: MANUAL_INITIAL_STATUS_VALUES })
    @IsIn(MANUAL_INITIAL_STATUS_VALUES)
    initialStatus!: ManualInitialStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(200)
    @Transform(({ value }) =>
        typeof value === 'string' && value.trim() === '' ? undefined : value,
    )
    internalMemo?: string;
}

export class CreatePartnerReservationResponseDto {
    @ApiProperty({
        type: Object,
        additionalProperties: true,
    })
    reservation!: {
        id: string;
        reserverName: string;
        status: string;
        source: string;
        artworkId: string;
        createdAt: string;
    };
}
