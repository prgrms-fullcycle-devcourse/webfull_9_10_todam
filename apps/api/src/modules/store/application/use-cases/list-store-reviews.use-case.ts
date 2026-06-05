import { Injectable } from '@nestjs/common';
import {
    StoreReviewsReader,
    type ListStoreReviewsQuery,
} from '../../domain/repositories/store-readers';

@Injectable()
export class ListStoreReviewsUseCase {
    constructor(private readonly reader: StoreReviewsReader) {}

    execute(slug: string, query: ListStoreReviewsQuery) {
        return this.reader.execute(slug, query);
    }
}
