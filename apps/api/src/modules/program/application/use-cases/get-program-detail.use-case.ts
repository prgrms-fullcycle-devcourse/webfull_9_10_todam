import { Injectable } from '@nestjs/common';
import type { ProgramDetailResult } from '@todam/shared';
import { PartnerProgramDetailReader } from '../../domain/repositories/program-readers';

@Injectable()
export class GetProgramDetailUseCase {
    constructor(private readonly reader: PartnerProgramDetailReader) {}

    // reader 는 difficulty/status 를 string union 으로 반환 → shared enum 응답 계약으로 정규화.
    execute(userId: string, storeId: string, programId: string): Promise<ProgramDetailResult> {
        // 소유권 검증과 조회를 reader 가 단일 쿼리로 함께 처리한다.
        return this.reader.execute(userId, storeId, programId) as Promise<ProgramDetailResult>;
    }
}
