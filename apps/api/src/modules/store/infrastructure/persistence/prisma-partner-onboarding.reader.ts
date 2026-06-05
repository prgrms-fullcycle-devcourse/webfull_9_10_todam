import { Injectable } from '@nestjs/common';
import { StoreStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import type { GetPartnerOnboardingResponseDto } from '../../presentation/dto/get-partner-onboarding.dto';

// GET /partner/onboarding — 온보딩 상태 조회 (검수중/반려 영속화).
// AuthGuard 만 적용(무파트너/PENDING/REJECTED 도 자기 상태 조회). 정상상태는 모두 200.
@Injectable()
export class PrismaPartnerOnboardingReader {
    constructor(private readonly prisma: PrismaService) {}

    async execute(userId: string): Promise<GetPartnerOnboardingResponseDto> {
        const partner = await this.prisma.partner.findUnique({
            where: { userId },
            select: { id: true, status: true },
        });

        // partner 없음 → 첫 등록 전. 게이트는 children 통과.
        if (!partner) {
            return { partnerStatus: null, store: null };
        }

        // 해당 파트너의 최신 생성순 온보딩 store 1건.
        const store = await this.prisma.store.findFirst({
            where: { partnerId: partner.id },
            orderBy: { createdAt: 'desc' },
            select: { id: true, status: true, rejectedReason: true },
        });

        if (!store) {
            return { partnerStatus: partner.status, store: null };
        }

        return {
            partnerStatus: partner.status,
            store: {
                id: store.id,
                status: store.status,
                // rejectedReason 은 store.status === REJECTED 일 때만 노출.
                rejectedReason: store.status === StoreStatus.REJECTED ? store.rejectedReason : null,
            },
        };
    }
}
