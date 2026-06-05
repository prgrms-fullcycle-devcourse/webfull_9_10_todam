import { HttpStatus, Injectable } from '@nestjs/common';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { ProgramRepository } from '../../domain/repositories/program.repository';
import type { ProgramDifficulty } from '../../domain/repositories/program.repository';
import type {
    CreateProgramDto,
    CreateProgramResponseDto,
} from '../../presentation/dto/create-program.dto';

@Injectable()
export class CreateProgramUseCase {
    constructor(
        private readonly ownership: StoreOwnershipService,
        private readonly programs: ProgramRepository,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        dto: CreateProgramDto,
    ): Promise<CreateProgramResponseDto> {
        // 공방 존재 + 소유 권한 검증.
        const store = await this.ownership.verify(userId, storeId, { notFound: 'STORE_NOT_FOUND' });

        // 공방 PUBLISHED 상태 검증 — 아니면 403 STORE_NOT_PUBLISHED.
        if (store.status !== 'PUBLISHED') {
            throw new BusinessException(
                'STORE_NOT_PUBLISHED',
                '게시된 공방에만 클래스를 등록할 수 있습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        const program = await this.programs.create(storeId, {
            title: dto.title,
            description: dto.description ?? null,
            materials: dto.materials ?? null,
            caution: dto.caution ?? null,
            price: dto.price,
            durationMinutes: dto.durationMinutes,
            difficulty: dto.difficulty as ProgramDifficulty,
            childFriendly: dto.childFriendly,
            leadTimeDays: dto.leadTimeDays,
            deliverable: dto.deliverable,
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
