import { Injectable } from '@nestjs/common';
import type { PartnerStoreDetailResult } from '@todam/shared';
import { PartnerStoreDetailReader } from '../../domain/repositories/store-readers';

@Injectable()
export class GetPartnerStoreDetailUseCase {
    constructor(private readonly reader: PartnerStoreDetailReader) {}

    // reader 는 status/ocrStatus 를 `${enum}` string union 으로 반환 → shared enum 응답 계약으로 정규화.
    execute(userId: string, storeId: string): Promise<PartnerStoreDetailResult> {
        return this.reader.execute(userId, storeId) as Promise<PartnerStoreDetailResult>;
    }
}
