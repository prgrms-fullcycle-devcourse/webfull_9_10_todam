import { HttpStatus, Injectable } from '@nestjs/common';
import { ProgramDifficulty } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { ErrorCode } from '../../../../common/constants/error-code';
import type {
    CreateProgramDto,
    CreateProgramResponseDto,
} from '../../presentation/dto/create-program.dto';

@Injectable()
export class CreateProgramUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(
        userId: string,
        storeId: string,
        dto: CreateProgramDto,
    ): Promise<CreateProgramResponseDto> {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: {
                id: true,
                status: true,
                partner: { select: { userId: true } },
            },
        });

        if (!store) {
            throw new BusinessException(
                'STORE_NOT_FOUND',
                '공방을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 공방 소유 권한 검증.
        if (store.partner.userId !== userId) {
            throw new BusinessException(
                ErrorCode.FORBIDDEN,
                '공방 소유 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // 공방 PUBLISHED 상태 검증 — 아니면 403 STORE_NOT_PUBLISHED.
        if (store.status !== 'PUBLISHED') {
            throw new BusinessException(
                'STORE_NOT_PUBLISHED',
                '게시된 공방에만 클래스를 등록할 수 있습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // programs + program_snapshots 동시 생성. 등록 시 status = ACTIVE (DRAFT 생략 결정).
        const program = await this.prisma.$transaction(async (tx) => {
            const created = await tx.program.create({
                data: {
                    storeId,
                    title: dto.title,
                    description: dto.description ?? null,
                    materials: dto.materials ?? null,
                    caution: dto.caution ?? null,
                    price: dto.price,
                    durationMinutes: dto.durationMinutes,
                    capacity: dto.capacity,
                    difficulty: dto.difficulty as ProgramDifficulty,
                    childFriendly: dto.childFriendly,
                    leadTimeDays: dto.leadTimeDays,
                    deliverable: dto.deliverable,
                    status: 'ACTIVE',
                },
                select: {
                    id: true,
                    storeId: true,
                    title: true,
                    status: true,
                    createdAt: true,
                },
            });

            await tx.programSnapshot.create({
                data: {
                    programId: created.id,
                    price: dto.price,
                    capacity: dto.capacity,
                    leadTimeDays: dto.leadTimeDays,
                },
            });

            return created;
        });

        return {
            program: {
                id: program.id,
                storeId: program.storeId,
                title: program.title,
                status: program.status,
                createdAt: program.createdAt.toISOString(),
            },
        };
    }
}
