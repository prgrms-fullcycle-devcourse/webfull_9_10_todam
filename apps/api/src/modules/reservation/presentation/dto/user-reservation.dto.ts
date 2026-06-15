import { ApiProperty } from '@nestjs/swagger';
import { ReservationStatus } from '@prisma/client';
import {
    cancelReservationResponseSchema,
    createUserReservationRequestSchema,
    createUserReservationResultSchema,
    deliveryEditResultSchema,
    getMyReservationsQuerySchema,
    reservationDetailResponseSchema,
} from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// ─── POST /reservations ───────────────────────────────────────────────────────
// 요청/응답 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class CreateUserReservationDto extends createZodDto(createUserReservationRequestSchema) {}
export class CreateUserReservationResponseDto extends createZodDto(
    createUserReservationResultSchema,
) {}

// ─── GET /reservations/me ─────────────────────────────────────────────────────
// 요청 SSOT = @todam/shared(zod).
export class GetMyReservationsQueryDto extends createZodDto(getMyReservationsQuerySchema) {}

// NOTE: 목록 응답 DTO는 아직 손으로 둔다. shared `reservationListItemSchema` 에 `category`(필수)가
// 남아있으나 BE 는 #200 회의 결정으로 category 를 반환하지 않는다. createZodDto 로 전환하면
// use-case 반환(category 없음)과 타입 충돌이 난다. shared 에서 category 제거(=#200 FE 협의 완료)
// 후 createZodDto(reservationListResultSchema) 로 전환 예정.
const RESERVATION_STATUS_VALUES = Object.values(ReservationStatus);

export class DisplayStateDto {
    @ApiProperty() label!: string;
    @ApiProperty() description!: string;
    @ApiProperty({ nullable: true }) subLabel!: string | null;
}

export class MyReservationItemDto {
    @ApiProperty() id!: string;
    @ApiProperty() storeName!: string;
    @ApiProperty() programTitle!: string;
    @ApiProperty({ description: 'ISO 8601' }) scheduledAt!: string;
    @ApiProperty({ description: 'ISO 8601' }) scheduledEndAt!: string;
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
// 응답 SSOT = @todam/shared(zod).
export class ReservationDetailResponseDto extends createZodDto(reservationDetailResponseSchema) {}

// ─── POST /reservations/:reservationId/cancel ─────────────────────────────────
// 요청 바디 없음 — 요청 DTO 불필요 (O3 확정).
// 응답 SSOT = @todam/shared(zod).
export class CancelReservationResponseDto extends createZodDto(cancelReservationResponseSchema) {}

// ─── PATCH /reservations/:reservationId/delivery ──────────────────────────────
// 응답 SSOT = @todam/shared(zod) deliveryEditResultSchema.
export class DeliveryEditResponseDto extends createZodDto(deliveryEditResultSchema) {}
