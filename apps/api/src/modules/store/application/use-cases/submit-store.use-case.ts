import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type { SubmitStoreResponseDto } from '../../presentation/dto/submit-store.dto';

@Injectable()
export class SubmitStoreUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(userId: string, storeId: string): Promise<SubmitStoreResponseDto> {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: {
                id: true,
                status: true,
                name: true,
                address: true,
                updatedAt: true,
                partner: { select: { userId: true } },
                images: {
                    where: { isThumbnail: true, status: 'UPLOADED' },
                    select: { id: true },
                    take: 1,
                },
            },
        });

        if (!store) {
            throw new BusinessException(
                'NOT_FOUND',
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

        if (store.status !== 'DRAFT' && store.status !== 'REJECTED') {
            throw new BusinessException(
                'INVALID_STORE_STATUS',
                'DRAFT 또는 REJECTED 상태의 공방만 제출할 수 있습니다.',
                HttpStatus.CONFLICT,
            );
        }

        const missingFields: string[] = [];
        if (!store.name) missingFields.push('name');
        if (!store.address) missingFields.push('address');
        if (store.images.length === 0) missingFields.push('thumbnail image');

        if (missingFields.length > 0) {
            throw new BusinessException(
                'MISSING_REQUIRED_FIELDS',
                `필수 정보가 누락되었습니다: ${missingFields.join(', ')}`,
                HttpStatus.BAD_REQUEST,
            );
        }

        const updated = await this.prisma.store.update({
            where: { id: storeId },
            data: { status: 'PENDING' },
            select: { id: true, status: true, updatedAt: true },
        });

        return {
            store: {
                id: updated.id,
                status: updated.status,
                updatedAt: updated.updatedAt.toISOString(),
            },
        };
    }
}
