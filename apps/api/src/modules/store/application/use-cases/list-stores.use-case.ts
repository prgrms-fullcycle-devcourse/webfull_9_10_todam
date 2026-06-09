import { Injectable } from '@nestjs/common';
import type { StoreListResult } from '@todam/shared';
import { StoresReader, type ListStoresQuery } from '../../domain/repositories/store-readers';

@Injectable()
export class ListStoresUseCase {
    constructor(private readonly reader: StoresReader) {}

    // reader 는 status 를 `${StoreStatus}` string union 으로 반환 → shared enum 응답 계약으로 정규화.
    execute(query: ListStoresQuery): Promise<StoreListResult> {
        return this.reader.execute(query) as Promise<StoreListResult>;
    }
}
