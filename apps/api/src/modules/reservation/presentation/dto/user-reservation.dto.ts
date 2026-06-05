import { ApiProperty } from '@nestjs/swagger';
import { ReservationStatus } from '@prisma/client';
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
