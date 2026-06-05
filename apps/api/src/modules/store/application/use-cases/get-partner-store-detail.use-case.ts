import { Injectable } from '@nestjs/common';
import { StoreQueryReader } from '../../domain/repositories/store-query.reader';

@Injectable()
export class GetPartnerStoreDetailUseCase {
    constructor(private readonly reader: StoreQueryReader) {}

    execute(userId: string, storeId: string) {
        return this.reader.getPartnerStoreDetail(userId, storeId);
    }
}
