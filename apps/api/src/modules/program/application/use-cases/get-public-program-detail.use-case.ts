import { Injectable } from '@nestjs/common';
import type { ProgramDetailResult } from '@todam/shared';
import { PublicProgramDetailReader } from '../../domain/repositories/program-readers';

@Injectable()
export class GetPublicProgramDetailUseCase {
    constructor(private readonly reader: PublicProgramDetailReader) {}

    // reader 는 difficulty/status 를 string union 으로 반환 → shared enum 응답 계약으로 정규화.
    execute(slug: string, programId: string): Promise<ProgramDetailResult> {
        return this.reader.execute(slug, programId) as Promise<ProgramDetailResult>;
    }
}
