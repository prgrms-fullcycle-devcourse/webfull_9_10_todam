import { HttpStatus, Injectable } from '@nestjs/common';
import { ProgramStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type {
    UpdateProgramStatusDto,
    UpdateProgramStatusResponseDto,
} from '../../presentation/dto/update-program-status.dto';

// 유효 전이: DRAFT → ACTIVE, ACTIVE → INACTIVE, INACTIVE → ACTIVE.
const VALID_TRANSITIONS: Record<ProgramStatus, ProgramStatus[]> = {
    DRAFT: ['ACTIVE'],
    ACTIVE: ['INACTIVE'],
    INACTIVE: ['ACTIVE'],
};

@Injectable()
export class UpdateProgramStatusUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(
        userId: string,
        storeId: string,
        programId: string,
        dto: UpdateProgramStatusDto,
    ): Promise<UpdateProgramStatusResponseDto> {
        const program = await this.prisma.program.findUnique({
            where: { id: programId },
            select: {
                id: true,
                storeId: true,
                status: true,
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

        const next = dto.status as ProgramStatus;

        // 같은 상태로의 변경 및 정의되지 않은 전이는 모두 차단.
        if (program.status !== next && !VALID_TRANSITIONS[program.status].includes(next)) {
            throw new BusinessException(
                'INVALID_STATUS_TRANSITION',
                `${program.status}에서 ${next}(으)로 상태를 변경할 수 없습니다.`,
                HttpStatus.BAD_REQUEST,
            );
        }

        if (program.status === next) {
            throw new BusinessException(
                'INVALID_STATUS_TRANSITION',
                '이미 동일한 상태입니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        const updated = await this.prisma.program.update({
            where: { id: programId },
            data: { status: next },
            select: { id: true, status: true, updatedAt: true },
        });

        return {
            program: {
                id: updated.id,
                status: updated.status,
                updatedAt: updated.updatedAt.toISOString(),
            },
        };
    }
}
