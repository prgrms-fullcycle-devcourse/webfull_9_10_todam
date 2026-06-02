import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type { ListPartnerStoresResponseDto } from '../../presentation/dto/list-partner-stores.dto';

@Injectable()
export class ListPartnerStoresUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(userId: string): Promise<ListPartnerStoresResponseDto> {
        // PartnerGuard 통과 시 승인된 파트너가 보장되지만, partnerId 식별을 위해 조회한다.
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

        // partner_id 소속 공방 전체 조회 (상태 무관) → 최신 생성순
        const stores = await this.prisma.store.findMany({
            where: { partnerId: partner.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                status: true,
                createdAt: true,
                businessDocs: {
                    orderBy: { createdAt: 'asc' },
                    take: 1,
                    select: { ownerName: true },
                },
            },
        });

        return {
            stores: stores.map((store) => ({
                id: store.id,
                name: store.name,
                ownerName: store.businessDocs[0]?.ownerName ?? '',
                status: store.status,
                createdAt: store.createdAt.toISOString(),
            })),
        };
    }
}
