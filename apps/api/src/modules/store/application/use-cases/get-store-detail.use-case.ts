import { Injectable } from '@nestjs/common';
import { StoreDetailReader } from '../../domain/repositories/store-readers';

@Injectable()
export class GetStoreDetailUseCase {
    constructor(private readonly reader: StoreDetailReader) {}

    execute(slug: string, userId?: string) {
        return this.reader.execute(slug, userId);
    }
}
