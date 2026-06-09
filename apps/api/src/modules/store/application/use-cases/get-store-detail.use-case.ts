import { Injectable } from '@nestjs/common';
import type { PublicStoreDetailResult } from '@todam/shared';
import { StoreDetailReader } from '../../domain/repositories/store-readers';

@Injectable()
export class GetStoreDetailUseCase {
    constructor(private readonly reader: StoreDetailReader) {}

    // reader 는 status 를 `${StoreStatus}` string union 으로 반환 → shared enum 응답 계약으로 정규화.
    execute(slug: string, userId?: string): Promise<PublicStoreDetailResult> {
        return this.reader.execute(slug, userId) as Promise<PublicStoreDetailResult>;
    }
}
