import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, ProgramDifficulty } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type {
    UpdateProgramDto,
    UpdateProgramResponseDto,
} from '../../presentation/dto/update-program.dto';

@Injectable()
export class UpdateProgramUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(
        userId: string,
        storeId: string,
        programId: string,
        dto: UpdateProgramDto,
    ): Promise<UpdateProgramResponseDto> {
        const program = await this.prisma.program.findUnique({
            where: { id: programId },
            select: {
                id: true,
                storeId: true,
                price: true,
                leadTimeDays: true,
                store: { select: { partner: { select: { userId: true } } } },
            },
        });

        if (!program || program.storeId !== storeId) {
            throw new BusinessException(
                'PROGRAM_NOT_FOUND',
                '클래스를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 공방 소유 권한 검증.
        if (program.store.partner.userId !== userId) {
            throw new BusinessException(
                'FORBIDDEN',
                '공방 소유 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // partial update — 전송된 필드만 data에 반영.
        const data: Prisma.ProgramUpdateInput = {};
        if (dto.title !== undefined) data.title = dto.title;
        if (dto.description !== undefined) data.description = dto.description;
        if (dto.materials !== undefined) data.materials = dto.materials;
        if (dto.caution !== undefined) data.caution = dto.caution;
        if (dto.price !== undefined) data.price = dto.price;
        if (dto.leadTimeDays !== undefined) data.leadTimeDays = dto.leadTimeDays;
        if (dto.durationMinutes !== undefined) data.durationMinutes = dto.durationMinutes;
        if (dto.difficulty !== undefined) data.difficulty = dto.difficulty as ProgramDifficulty;
        if (dto.childFriendly !== undefined) data.childFriendly = dto.childFriendly;
        if (dto.deliverable !== undefined) data.deliverable = dto.deliverable;

        // 가격 또는 리드타임이 "실제로" 바뀌고, 기존 예약이 1건 이상이면 스냅샷 신규 row 생성.
        const priceChanged = dto.price !== undefined && dto.price !== program.price;
        const leadTimeChanged =
            dto.leadTimeDays !== undefined && dto.leadTimeDays !== program.leadTimeDays;
        const snapshotTrigger = priceChanged || leadTimeChanged;

        const updated = await this.prisma.$transaction(async (tx) => {
            const result = await tx.program.update({
                where: { id: programId },
                data,
                select: { id: true, title: true, price: true, status: true, updatedAt: true },
            });

            if (snapshotTrigger) {
                const reservationCount = await tx.reservation.count({ where: { programId } });
                if (reservationCount > 0) {
                    await tx.programSnapshot.create({
                        data: {
                            programId,
                            price: result.price,
                            leadTimeDays:
                                dto.leadTimeDays !== undefined
                                    ? dto.leadTimeDays
                                    : program.leadTimeDays,
                        },
                    });
                }
            }

            return result;
        });

        return {
            program: {
                id: updated.id,
                title: updated.title,
                price: updated.price,
                status: updated.status,
                updatedAt: updated.updatedAt.toISOString(),
            },
        };
    }
}
