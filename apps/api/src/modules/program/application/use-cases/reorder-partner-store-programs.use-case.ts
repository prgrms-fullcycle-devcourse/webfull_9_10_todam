import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type { ReorderPartnerStoreProgramsDto } from '../../presentation/dto/reorder-partner-store-programs.dto';
import type { ListPartnerStoreProgramsResponseDto } from '../../presentation/dto/list-partner-store-programs.dto';

@Injectable()
export class ReorderPartnerStoreProgramsUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(
        userId: string,
        storeId: string,
        dto: ReorderPartnerStoreProgramsDto,
    ): Promise<ListPartnerStoreProgramsResponseDto> {
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

        // 미존재·삭제 공방 → 404
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

        // 검증: 요청 id 집합이 해당 공방 전체 program 집합과 정확히 일치해야 한다.
        // (누락·중복·타 공방 ID 섞임 → 400 INVALID_PROGRAM_ORDER)
        const existing = await this.prisma.program.findMany({
            where: { storeId: store.id },
            select: { id: true },
        });
        const existingIds = new Set(existing.map((p) => p.id));

        const requestedIds = dto.programs.map((p) => p.id);
        const requestedIdSet = new Set(requestedIds);

        const hasDuplicate = requestedIdSet.size !== requestedIds.length;
        const sameSize = requestedIdSet.size === existingIds.size;
        const allOwned = requestedIds.every((id) => existingIds.has(id));

        if (hasDuplicate || !sameSize || !allOwned) {
            throw new BusinessException(
                'INVALID_PROGRAM_ORDER',
                '클래스 순서 목록이 해당 공방의 전체 클래스와 일치하지 않습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        // 트랜잭션: sortOrder 일괄 갱신, 실패 시 전체 rollback.
        await this.prisma.$transaction(
            dto.programs.map((program) =>
                this.prisma.program.update({
                    where: { id: program.id },
                    data: { sortOrder: program.sortOrder },
                }),
            ),
        );

        // 재정렬된 전체 목록을 GET use-case 와 동일하게 재조회하여 반환한다.
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
