import { ApiProperty } from '@nestjs/swagger';
import {
    cancelPartnerReservationRequestSchema,
    createPartnerReservationRequestSchema,
    listPartnerReservationsQuerySchema,
    partnerReservationCalendarQuerySchema,
    rejectPartnerReservationRequestSchema,
} from '@todam/shared';
import { createZodDto } from 'nestjs-zod';
import type { PartnerReservationAction } from '../../domain/reservation-actions';

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class PartnerReservationCalendarQueryDto extends createZodDto(
    partnerReservationCalendarQuerySchema,
) {}

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

export class ListPartnerReservationsQueryDto extends createZodDto(
    listPartnerReservationsQuerySchema,
) {}

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

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class CancelPartnerReservationDto extends createZodDto(
    cancelPartnerReservationRequestSchema,
) {}

export class RejectPartnerReservationDto extends createZodDto(
    rejectPartnerReservationRequestSchema,
) {}

export class CreatePartnerReservationDto extends createZodDto(
    createPartnerReservationRequestSchema,
) {}

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
