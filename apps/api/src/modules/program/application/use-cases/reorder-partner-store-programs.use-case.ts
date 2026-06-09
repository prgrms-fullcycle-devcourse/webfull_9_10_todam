import { HttpStatus, Injectable } from '@nestjs/common';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { ProgramRepository } from '../../domain/repositories/program.repository';
import { PartnerStoreProgramsReader } from '../../domain/repositories/program-readers';
import type { ReorderPartnerStoreProgramsDto } from '../../presentation/dto/reorder-partner-store-programs.dto';
import type { PartnerProgramListResult } from '@todam/shared';

@Injectable()
export class ReorderPartnerStoreProgramsUseCase {
    constructor(
        private readonly ownership: StoreOwnershipService,
        private readonly programs: ProgramRepository,
        private readonly reader: PartnerStoreProgramsReader,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        dto: ReorderPartnerStoreProgramsDto,
    ): Promise<PartnerProgramListResult> {
        // 공방 존재(404) + 소유 권한(403) 검증. 파트너센터 문구는 공방 단위 접근 권한 기준.
        await this.ownership.verify(userId, storeId, {
            notFound: 'STORE_NOT_FOUND',
            forbiddenMessage: '해당 공방에 대한 접근 권한이 없습니다.',
        });

        // 검증: 요청 id 집합이 해당 공방 전체 program 집합과 정확히 일치해야 한다.
        // (누락·중복·타 공방 ID 섞임 → 400 INVALID_PROGRAM_ORDER)
        const existingIds = new Set(await this.programs.listIds(storeId));

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

        await this.programs.reorder(
            dto.programs.map((program) => ({ id: program.id, sortOrder: program.sortOrder })),
        );

        // 재정렬된 전체 목록을 GET use-case 와 동일하게 재조회하여 반환한다.
        // reader 는 difficulty/status 를 string union 으로 반환 → shared enum 응답 계약으로 정규화.
        return this.reader.execute(storeId) as Promise<PartnerProgramListResult>;
    }
}
