import { Injectable } from '@nestjs/common';
import { StoreQueryReader } from '../../domain/repositories/store-query.reader';

@Injectable()
export class GetStoreDetailUseCase {
    constructor(private readonly reader: StoreQueryReader) {}

    execute(slug: string, userId?: string) {
        return this.reader.getStoreDetail(slug, userId);
    }
}
