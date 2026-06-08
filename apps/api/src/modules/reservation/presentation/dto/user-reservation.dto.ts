import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationDeliveryMethod, ReservationStatus } from '@prisma/client';
import { createUserReservationRequestSchema, getMyReservationsQuerySchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class CreateUserReservationDto extends createZodDto(createUserReservationRequestSchema) {}

export class DisplayStateDto {
    @ApiProperty() label!: string;
    @ApiProperty() description!: string;
    @ApiProperty({ nullable: true }) subLabel!: string | null;
}

export class UserReservationResultDto {
    @ApiProperty() id!: string;
    @ApiProperty() programId!: string;
    @ApiProperty() slotId!: string;
    @ApiProperty() reserverName!: string;
    @ApiProperty() participantCount!: number;
    @ApiProperty() status!: string;
    @ApiProperty({ type: DisplayStateDto }) displayState!: DisplayStateDto;
    @ApiProperty() createdAt!: string;
}

export class CreateUserReservationResponseDto {
    @ApiProperty({ type: UserReservationResultDto })
    reservation!: UserReservationResultDto;
}

// ─── GET /reservations/me ─────────────────────────────────────────────────────

const RESERVATION_STATUS_VALUES = Object.values(ReservationStatus);

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class GetMyReservationsQueryDto extends createZodDto(getMyReservationsQuerySchema) {}

export class MyReservationItemDto {
    @ApiProperty() id!: string;
    @ApiProperty() storeName!: string;
    @ApiProperty() programTitle!: string;
    @ApiProperty({ description: 'ISO 8601' }) scheduledAt!: string;
    @ApiProperty() participantCount!: number;
    @ApiProperty({ enum: RESERVATION_STATUS_VALUES }) status!: ReservationStatus;
    @ApiProperty({ type: DisplayStateDto }) displayState!: DisplayStateDto;
    @ApiProperty({ description: 'ISO 8601' }) createdAt!: string;
}

export class MyReservationsResponseDto {
    @ApiProperty({ type: [MyReservationItemDto] }) reservations!: MyReservationItemDto[];
    @ApiProperty({ nullable: true }) nextCursor!: string | null;
    @ApiProperty() hasMore!: boolean;
}

// ─── GET /reservations/:reservationId ────────────────────────────────────────

export class ReservationDetailDeliveryDto {
    @ApiProperty() recipientName!: string;
    @ApiProperty() recipientPhone!: string;
    @ApiProperty() address!: string;
    @ApiProperty({ nullable: true }) carrier!: string | null;
    @ApiProperty({ nullable: true }) trackingNumber!: string | null;
}

export class ReservationDetailArtworkDto {
    @ApiProperty() id!: string;
    @ApiProperty({ minimum: 0, maximum: 100 }) progressPercent!: number;
    @ApiProperty({ minimum: 0 }) remainingSteps!: number;
}

export class ReservationDetailDto {
    @ApiProperty() id!: string;
    @ApiProperty() storeId!: string;
    @ApiProperty() storeName!: string;
    @ApiProperty() programId!: string;
    @ApiProperty() programTitle!: string;
    @ApiProperty({ description: 'ISO 8601' }) scheduledAt!: string;
    @ApiProperty() reserverName!: string;
    @ApiProperty() reserverPhone!: string;
    @ApiProperty({ minimum: 1 }) participantCount!: number;
    @ApiProperty({ enum: Object.values(ReservationDeliveryMethod) })
    deliveryMethod!: ReservationDeliveryMethod;
    @ApiPropertyOptional({ nullable: true }) shippingAddress!: string | null;
    @ApiPropertyOptional({ nullable: true }) requestMemo!: string | null;
    @ApiProperty({ enum: Object.values(ReservationStatus) }) status!: ReservationStatus;
    @ApiProperty({ type: DisplayStateDto }) displayState!: DisplayStateDto;
    @ApiPropertyOptional({ nullable: true }) artworkId!: string | null;
    @ApiProperty({ description: 'ISO 8601' }) createdAt!: string;
    @ApiProperty({ minimum: 0 }) totalPrice!: number;
    @ApiProperty({ type: ReservationDetailDeliveryDto, nullable: true })
    delivery!: ReservationDetailDeliveryDto | null;
    @ApiProperty() canCancel!: boolean;
    @ApiProperty({ nullable: true }) cancelDeadlineDays!: number | null;
    @ApiProperty({ type: ReservationDetailArtworkDto, nullable: true })
    artwork!: ReservationDetailArtworkDto | null;
    @ApiProperty() hasReview!: boolean;
    @ApiProperty({ nullable: true }) reviewId!: string | null;
}

export class ReservationDetailResponseDto {
    @ApiProperty({ type: ReservationDetailDto }) reservation!: ReservationDetailDto;
}
