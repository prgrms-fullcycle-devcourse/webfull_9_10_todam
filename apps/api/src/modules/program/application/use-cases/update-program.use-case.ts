import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { ProgramRepository } from '../../domain/repositories/program.repository';
import type {
    ProgramDifficulty,
    UpdateProgramFields,
} from '../../domain/repositories/program.repository';
import type {
    UpdateProgramDto,
    UpdateProgramResponseDto,
} from '../../presentation/dto/update-program.dto';

@Injectable()
export class UpdateProgramUseCase {
    constructor(private readonly programs: ProgramRepository) {}

    async execute(
        userId: string,
        storeId: string,
        programId: string,
        dto: UpdateProgramDto,
    ): Promise<UpdateProgramResponseDto> {
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

        // partial update — 전송된 필드만 반영.
        const fields: UpdateProgramFields = {};
        if (dto.title !== undefined) fields.title = dto.title;
        if (dto.description !== undefined) fields.description = dto.description;
        if (dto.materials !== undefined) fields.materials = dto.materials;
        if (dto.caution !== undefined) fields.caution = dto.caution;
        if (dto.price !== undefined) fields.price = dto.price;
        if (dto.leadTimeDays !== undefined) fields.leadTimeDays = dto.leadTimeDays;
        if (dto.durationMinutes !== undefined) fields.durationMinutes = dto.durationMinutes;
        if (dto.difficulty !== undefined) fields.difficulty = dto.difficulty as ProgramDifficulty;
        if (dto.childFriendly !== undefined) fields.childFriendly = dto.childFriendly;
        if (dto.deliverable !== undefined) fields.deliverable = dto.deliverable;

        // 가격 또는 리드타임이 "실제로" 바뀌면 스냅샷 신규 row 대상(실제 생성/값 계산은 repository 트랜잭션 내부에서).
        const priceChanged = dto.price !== undefined && dto.price !== program.price;
        const leadTimeChanged =
            dto.leadTimeDays !== undefined && dto.leadTimeDays !== program.leadTimeDays;

        const updated = await this.programs.update(
            programId,
            fields,
            priceChanged || leadTimeChanged,
        );

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
