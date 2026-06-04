import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type { ListPartnerStoreProgramsResponseDto } from '../../presentation/dto/list-partner-store-programs.dto';

@Injectable()
export class ListPartnerStoreProgramsUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(userId: string, storeId: string): Promise<ListPartnerStoreProgramsResponseDto> {
        // PartnerGuard 통과 시 승인된 파트너가 보장되지만, partnerId 식별을 위해 조회한다.
        const partner = await this.prisma.partner.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!partner) {
            throw new BusinessException(
                'FORBIDDEN',
                '해당 공방에 대한 접근 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: { id: true, partnerId: true },
        });

        // 미존재·삭제 공방 → 404 (CONTRACT-5)
        if (!store) {
            throw new BusinessException(
                'STORE_NOT_FOUND',
                '공방을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 소유 권한 검증: 토큰 파트너와 공방 partner_id 불일치 → 403
        if (store.partnerId !== partner.id) {
            throw new BusinessException(
                'FORBIDDEN',
                '해당 공방에 대한 접근 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // 파트너센터용: class status enum 전체 포함 (DRAFT/ACTIVE/INACTIVE), ACTIVE 필터링 안 함.
        const programs = await this.prisma.program.findMany({
            where: { storeId: store.id },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
            select: {
                id: true,
                title: true,
                price: true,
                durationMinutes: true,
                difficulty: true,
                leadTimeDays: true,
                status: true,
            },
        });

        return {
            programs: programs.map((program) => ({
                id: program.id,
                title: program.title,
                price: program.price,
                durationMinutes: program.durationMinutes,
                difficulty: program.difficulty,
                leadTimeDays: program.leadTimeDays,
                status: program.status,
            })),
        };
    }
}
