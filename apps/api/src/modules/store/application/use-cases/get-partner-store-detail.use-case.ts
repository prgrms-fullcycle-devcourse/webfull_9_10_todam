import { Injectable } from '@nestjs/common';
import { PartnerStoreDetailReader } from '../../domain/repositories/store-readers';

@Injectable()
export class GetPartnerStoreDetailUseCase {
    constructor(private readonly reader: PartnerStoreDetailReader) {}

    execute(userId: string, storeId: string) {
        return this.reader.execute(userId, storeId);
    }
}
