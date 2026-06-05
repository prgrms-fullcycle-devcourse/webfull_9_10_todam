import { Injectable } from '@nestjs/common';
import { StoreQueryReader } from '../../domain/repositories/store-query.reader';
import type { ListStoreReviewsQueryDto } from '../../presentation/dto/list-store-reviews.dto';

@Injectable()
export class ListStoreReviewsUseCase {
    constructor(private readonly reader: StoreQueryReader) {}

    execute(slug: string, query: ListStoreReviewsQueryDto) {
        return this.reader.listStoreReviews(slug, query);
    }
}
