import { Injectable } from '@nestjs/common';
import type { StoreProgramListResult } from '@todam/shared';
import { StoreProgramsReader } from '../../domain/repositories/store-readers';

@Injectable()
export class ListStoreProgramsUseCase {
    constructor(private readonly reader: StoreProgramsReader) {}

    // reader 는 difficulty/status 를 `${enum}` string union 으로 반환 → shared enum 응답 계약으로 정규화.
    execute(slug: string): Promise<StoreProgramListResult> {
        return this.reader.execute(slug) as Promise<StoreProgramListResult>;
    }
}
