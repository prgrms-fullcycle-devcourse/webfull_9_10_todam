import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';

export type OwnedStoreTimeSlotConfig = {
    id: string;
    maxCapacityPerSlot: number | null;
    reservationIntervalMinutes: number | null;
};

@Injectable()
export class StoreAccessService {
    constructor(private readonly prisma: PrismaService) {}

    async verifyOwnership(userId: string, storeId: string): Promise<OwnedStoreTimeSlotConfig> {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: {
                id: true,
                maxCapacityPerSlot: true,
                reservationIntervalMinutes: true,
                partner: { select: { userId: true } },
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
            maxCapacityPerSlot: store.maxCapacityPerSlot,
            reservationIntervalMinutes: store.reservationIntervalMinutes,
        };
    }
}
