import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    Min,
    MinLength,
} from 'class-validator';
import { ReservationDeliveryMethod } from '@prisma/client';

const DELIVERY_METHOD_VALUES = Object.values(ReservationDeliveryMethod);

export class CreateUserReservationDto {
    @ApiProperty({ description: '프로그램 ID' })
    @IsUUID()
    programId!: string;

    @ApiProperty({ description: '선택한 슬롯 ID (StoreTimeSlot.id)' })
    @IsUUID()
    slotId!: string;

    @ApiProperty({ description: '예약자명 (2~20자)', minLength: 2, maxLength: 20 })
    @IsString()
    @MinLength(2)
    @MaxLength(20)
    reserverName!: string;

    @ApiProperty({ description: '연락처 (휴대전화 형식)' })
    @IsString()
    @MaxLength(20)
    reserverPhone!: string;

    @ApiProperty({ description: '참가 인원 (1 이상)', minimum: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    participantCount!: number;

    @ApiPropertyOptional({
        enum: DELIVERY_METHOD_VALUES,
        description: 'Program.deliverable=true면 선택, false면 PICKUP 고정',
    })
    @IsOptional()
    @IsIn(DELIVERY_METHOD_VALUES)
    deliveryMethod?: ReservationDeliveryMethod;

    @ApiPropertyOptional({ description: '예약 메모' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    requestMemo?: string;
}

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
