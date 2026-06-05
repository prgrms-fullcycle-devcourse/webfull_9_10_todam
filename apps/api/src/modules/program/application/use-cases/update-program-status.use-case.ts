import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { ProgramRepository } from '../../domain/repositories/program.repository';
import type { ProgramStatus } from '../../domain/repositories/program.repository';
import { ProgramStatusPolicy } from '../../domain/services/program-status-policy.service';
import type {
    UpdateProgramStatusDto,
    UpdateProgramStatusResponseDto,
} from '../../presentation/dto/update-program-status.dto';

@Injectable()
export class UpdateProgramStatusUseCase {
    constructor(private readonly programs: ProgramRepository) {}

    async execute(
        userId: string,
        storeId: string,
        programId: string,
        dto: UpdateProgramStatusDto,
    ): Promise<UpdateProgramStatusResponseDto> {
        const program = await this.programs.findOwnership(programId);

        if (!program || program.storeId !== storeId) {
            throw new BusinessException(
                'PROGRAM_NOT_FOUND',
                '클래스를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 공방 소유 권한 검증.
        if (program.ownerUserId !== userId) {
            throw new BusinessException(
                'FORBIDDEN',
                '공방 소유 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        const next = dto.status as ProgramStatus;

        // 상태 전이 가부는 도메인 정책(ProgramStatusPolicy)이 판단한다.
        const transition = ProgramStatusPolicy.evaluate(program.status, next);

        if (transition === 'SAME_STATUS') {
            throw new BusinessException(
                'INVALID_STATUS_TRANSITION',
                '이미 동일한 상태입니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        if (transition === 'INVALID') {
            throw new BusinessException(
                'INVALID_STATUS_TRANSITION',
                `${program.status}에서 ${next}(으)로 상태를 변경할 수 없습니다.`,
                HttpStatus.BAD_REQUEST,
            );
        }

        const updated = await this.programs.updateStatus(programId, next);

        return {
            program: {
                id: updated.id,
                status: updated.status,
                updatedAt: updated.updatedAt.toISOString(),
            },
        };
    }
}
