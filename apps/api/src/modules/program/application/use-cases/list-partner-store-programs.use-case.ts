import { Injectable } from '@nestjs/common';
import type { PartnerProgramListResult } from '@todam/shared';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { PartnerStoreProgramsReader } from '../../domain/repositories/program-readers';

@Injectable()
export class ListPartnerStoreProgramsUseCase {
    constructor(
        private readonly ownership: StoreOwnershipService,
        private readonly reader: PartnerStoreProgramsReader,
    ) {}

    // reader 는 difficulty/status 를 string union 으로 반환 → shared enum 응답 계약으로 정규화.
    async execute(userId: string, storeId: string): Promise<PartnerProgramListResult> {
        // 공방 존재(404) + 소유 권한(403) 검증. 파트너센터 문구는 공방 단위 접근 권한 기준.
        await this.ownership.verify(userId, storeId, {
            notFound: 'STORE_NOT_FOUND',
            forbiddenMessage: '해당 공방에 대한 접근 권한이 없습니다.',
        });

        return this.reader.execute(storeId) as Promise<PartnerProgramListResult>;
    }
}
