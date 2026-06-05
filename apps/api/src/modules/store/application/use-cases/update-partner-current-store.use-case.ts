import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type { UpdatePartnerCurrentStoreResponseDto } from '../../presentation/dto/partner-current-store.dto';

@Injectable()
export class UpdatePartnerCurrentStoreUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(userId: string, storeId: string): Promise<UpdatePartnerCurrentStoreResponseDto> {
        const partner = await this.prisma.partner.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!partner) {
            throw new BusinessException(
                'FORBIDDEN',
                '파트너 권한이 필요합니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // 공방 존재 여부 확인
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: { id: true, partnerId: true },
        });

        if (!store) {
            throw new BusinessException(
                'RESOURCE_NOT_FOUND',
                '공방을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 소유권 검증
        if (store.partnerId !== partner.id) {
            throw new BusinessException(
                'FORBIDDEN',
                '해당 공방에 대한 접근 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        await this.prisma.partner.update({
            where: { id: partner.id },
            data: { lastAccessedStoreId: storeId },
        });

        return { lastAccessedStoreId: storeId };
    }
}
