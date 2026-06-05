import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type { GetPartnerCurrentStoreResponseDto } from '../../presentation/dto/partner-current-store.dto';

@Injectable()
export class GetPartnerCurrentStoreUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(userId: string): Promise<GetPartnerCurrentStoreResponseDto> {
        const partner = await this.prisma.partner.findUnique({
            where: { userId },
            select: {
                id: true,
                lastAccessedStoreId: true,
            },
        });

        if (!partner) {
            throw new BusinessException(
                'FORBIDDEN',
                '파트너 권한이 필요합니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        const stores = await this.prisma.store.findMany({
            where: { partnerId: partner.id },
            orderBy: { createdAt: 'asc' },
            select: { id: true, name: true, status: true },
        });

        return {
            lastAccessedStoreId: partner.lastAccessedStoreId,
            stores,
        };
    }
}
