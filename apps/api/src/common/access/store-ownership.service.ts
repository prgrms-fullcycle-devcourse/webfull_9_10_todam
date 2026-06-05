import { HttpStatus, Injectable } from '@nestjs/common';
import { StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BusinessException } from '../exceptions/business.exception';

/**
 * 공방 소유권 검증 결과(범용 projection).
 * 특정 모듈 전용 필드명이 아닌 store 일반 설정값을 노출한다.
 */
export interface OwnedStore {
    id: string;
    partnerId: string;
    status: StoreStatus;
    maxCapacityPerSlot: number | null;
    reservationIntervalMinutes: number | null;
}

/**
 * 공방 존재 + 소유권(파트너=요청자) 검증 cross-cutting 서비스.
 * 인가성 관심사이므로 PartnerGuard 와 동일 결로 PrismaService 를 직접 사용한다(도메인 포트로 감싸지 않음).
 */
@Injectable()
export class StoreOwnershipService {
    constructor(private readonly prisma: PrismaService) {}

    async verify(userId: string, storeId: string): Promise<OwnedStore> {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: {
                id: true,
                status: true,
                maxCapacityPerSlot: true,
                reservationIntervalMinutes: true,
                partner: { select: { id: true, userId: true } },
            },
        });

        if (!store) {
            throw new BusinessException(
                'RESOURCE_NOT_FOUND',
                '공방을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        if (store.partner.userId !== userId) {
            throw new BusinessException(
                'FORBIDDEN',
                '공방 소유 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        return {
            id: store.id,
            partnerId: store.partner.id,
            status: store.status,
            maxCapacityPerSlot: store.maxCapacityPerSlot,
            reservationIntervalMinutes: store.reservationIntervalMinutes,
        };
    }
}
