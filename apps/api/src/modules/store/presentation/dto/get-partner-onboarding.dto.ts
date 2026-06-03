import { ApiProperty } from '@nestjs/swagger';
import { PartnerStatus, StoreStatus } from '@prisma/client';

export class GetPartnerOnboardingStoreDto {
    @ApiProperty() id!: string;
    @ApiProperty({ enum: StoreStatus }) status!: StoreStatus;
    // store.status === REJECTED 일 때만 값, 그 외 null.
    @ApiProperty({ type: String, nullable: true }) rejectedReason!: string | null;
}

export class GetPartnerOnboardingResponseDto {
    // partner 없으면 null.
    @ApiProperty({ enum: PartnerStatus, nullable: true })
    partnerStatus!: PartnerStatus | null;

    // 최신 생성순 온보딩 store 1건. 없으면 null.
    @ApiProperty({ type: GetPartnerOnboardingStoreDto, nullable: true })
    store!: GetPartnerOnboardingStoreDto | null;
}
