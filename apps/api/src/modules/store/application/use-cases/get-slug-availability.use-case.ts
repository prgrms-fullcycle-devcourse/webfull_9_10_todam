import { Injectable } from '@nestjs/common';
import { StoreQueryReader } from '../../domain/repositories/store-query.reader';

@Injectable()
export class GetSlugAvailabilityUseCase {
    constructor(private readonly reader: StoreQueryReader) {}

    execute(userId: string, slug: string | undefined, excludeStoreId?: string) {
        return this.reader.getSlugAvailability(userId, slug, excludeStoreId);
    }
}
