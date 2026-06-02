import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OcrStatus, StoreStatus } from '@prisma/client';

export class StoreDetailConvenienceInfoDto {
    @ApiProperty({ example: true, description: '주차 가능 여부' })
    parking!: boolean;

    @ApiProperty({ example: false, description: '반려동물 동반 가능 여부' })
    pet!: boolean;

    @ApiProperty({ example: true, description: '와이파이 제공 여부' })
    wifi!: boolean;
}

export class StoreDetailOperatingHourDto {
    @ApiProperty({ example: 'MON', description: '요일' })
    dayOfWeek!: string;

    @ApiProperty({ example: '10:00', description: '오픈 시각 (HH:mm)' })
    openTime!: string;

    @ApiProperty({ example: '19:00', description: '마감 시각 (HH:mm)' })
    closeTime!: string;

    @ApiPropertyOptional({ example: '13:00', nullable: true, description: '브레이크 시작 (HH:mm)' })
    breakStart!: string | null;

    @ApiPropertyOptional({ example: '14:00', nullable: true, description: '브레이크 종료 (HH:mm)' })
    breakEnd!: string | null;
}

export class StoreDetailImageDto {
    @ApiProperty({ example: 'img-uuid-001' })
    id!: string;

    @ApiProperty({ example: 'https://cdn.todam.app/stores/todam-studio/01.jpg' })
    imageUrl!: string;

    @ApiPropertyOptional({
        example: 'https://cdn.todam.app/stores/todam-studio/01_thumb.jpg',
        nullable: true,
    })
    thumbnailUrl!: string | null;

    @ApiProperty({ example: true })
    isThumbnail!: boolean;

    @ApiProperty({ example: 1 })
    sortOrder!: number;
}

export class StoreDetailBusinessDocumentDto {
    @ApiProperty({ example: '김토담' })
    ownerName!: string;

    @ApiPropertyOptional({ example: 'partner@example.com', nullable: true })
    email!: string | null;

    @ApiProperty({ example: '토담 공방' })
    businessName!: string;

    @ApiProperty({ example: '123-45-67890' })
    businessNumber!: string;

    @ApiProperty({ example: '서울특별시 성동구 성수이로 12길 34' })
    businessAddress!: string;

    @ApiPropertyOptional({ enum: OcrStatus, nullable: true, example: OcrStatus.VERIFIED })
    ocrStatus!: OcrStatus | null;
}

export class StoreDetailDto {
    @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
    id!: string;

    @ApiProperty({ example: 'd5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a' })
    partnerId!: string;

    @ApiProperty({ example: '토담 공방' })
    name!: string;

    @ApiProperty({ example: 'todam-studio' })
    slug!: string;

    @ApiProperty({ example: '흙과 함께하는 도자기 체험 공방입니다.', nullable: true })
    description!: string | null;

    @ApiProperty({ example: '02-1234-5678', nullable: true })
    phone!: string | null;

    @ApiProperty({ example: '서울특별시 성동구 성수이로 12길 34', nullable: true })
    address!: string | null;

    @ApiProperty({ example: 37.5446, nullable: true })
    latitude!: number | null;

    @ApiProperty({ example: 127.0556, nullable: true })
    longitude!: number | null;

    @ApiProperty({ type: StoreDetailConvenienceInfoDto })
    convenienceInfo!: StoreDetailConvenienceInfoDto;

    @ApiProperty({ example: false })
    autoConfirm!: boolean;

    @ApiProperty({ example: 1, nullable: true })
    cancelDeadlineDays!: number | null;

    @ApiProperty({
        example: 30,
        description: '예약 시간 간격(분). 예약 정보 수정화면 preload (OD-1)',
    })
    reservationIntervalMinutes!: number;

    @ApiProperty({
        example: 6,
        description: '슬롯당 최대 수용 인원. 예약 정보 수정화면 preload (OD-1)',
    })
    maxCapacityPerSlot!: number;

    @ApiProperty({ enum: StoreStatus, example: StoreStatus.PUBLISHED })
    status!: StoreStatus;

    @ApiProperty({ example: null, nullable: true, description: '검수 반려 사유' })
    rejectedReason!: string | null;

    @ApiProperty({ example: null, nullable: true, description: '노출 중단 사유' })
    suspendedReason!: string | null;

    @ApiProperty({ example: 4.8, description: '공방 평균 별점. 리뷰 없으면 0' })
    rating!: number;

    @ApiProperty({ example: 132, description: '공방 리뷰 수. 리뷰 없으면 0' })
    reviewCount!: number;

    @ApiProperty({
        example: 5,
        description: '진행 중 예약 건수 = 체험 완료 처리되지 않은 예약 건수. 없으면 0',
    })
    inProgressReservationCount!: number;

    @ApiProperty({ type: [StoreDetailOperatingHourDto] })
    operatingHours!: StoreDetailOperatingHourDto[];

    @ApiProperty({ type: [StoreDetailImageDto] })
    images!: StoreDetailImageDto[];

    @ApiProperty({ type: StoreDetailBusinessDocumentDto, nullable: true })
    businessDocument!: StoreDetailBusinessDocumentDto | null;

    @ApiProperty({ example: '2026-05-20T10:00:00.000Z', nullable: true })
    publishedAt!: string | null;

    @ApiProperty({ example: '2026-05-18T12:00:00.000Z' })
    createdAt!: string;
}

export class GetPartnerStoreDetailResponseDto {
    @ApiProperty({ type: StoreDetailDto })
    store!: StoreDetailDto;
}
