import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { BusinessException } from '../../../common/exceptions/business.exception';

// 공방 존재 + 소유권 검증. 통과 시 store 식별 정보 반환.
export async function verifyStoreOwnership(
    prisma: PrismaService,
    userId: string,
    storeId: string,
): Promise<{
    id: string;
    maxCapacityPerSlot: number | null;
    reservationIntervalMinutes: number | null;
}> {
    const store = await prisma.store.findUnique({
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
