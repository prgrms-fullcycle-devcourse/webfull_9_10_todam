import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ReservationStatus } from '@prisma/client';
import { createUserReservationRequestSchema } from '@todam/shared';
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

export class GetMyReservationsQueryDto {
    @ApiPropertyOptional({
        enum: RESERVATION_STATUS_VALUES,
        description: 'ReservationStatus 필터',
    })
    @IsOptional()
    @IsIn(RESERVATION_STATUS_VALUES)
    status?: ReservationStatus;

    @ApiPropertyOptional({ description: '이전 응답의 nextCursor (예약 id)' })
    @IsOptional()
    @IsString()
    cursor?: string;

    @ApiPropertyOptional({ description: '한 번에 가져올 항목 수 (기본 20)', minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number;
}

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
