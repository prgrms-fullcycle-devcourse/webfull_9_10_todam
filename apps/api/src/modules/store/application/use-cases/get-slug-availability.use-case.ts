import { Injectable } from '@nestjs/common';
import { SlugAvailabilityReader } from '../../domain/repositories/store-readers';

@Injectable()
export class GetSlugAvailabilityUseCase {
    constructor(private readonly reader: SlugAvailabilityReader) {}

    execute(userId: string, slug: string | undefined, excludeStoreId?: string) {
        return this.reader.execute(userId, slug, excludeStoreId);
    }
}
