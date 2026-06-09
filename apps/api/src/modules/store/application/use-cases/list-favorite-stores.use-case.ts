import { Injectable } from '@nestjs/common';
import { DEFAULT_PAGE_SIZE } from '@todam/shared';
import { FavoriteStoresReader } from '../../domain/repositories/store-readers';
import type { ListFavoriteStoresResult } from '../../domain/repositories/store-readers';
import type { FavoriteStoresQuery } from '@todam/shared';

@Injectable()
export class ListFavoriteStoresUseCase {
    constructor(private readonly reader: FavoriteStoresReader) {}

    async execute(userId: string, query: FavoriteStoresQuery): Promise<ListFavoriteStoresResult> {
        const limit = query.limit ?? DEFAULT_PAGE_SIZE;

        return this.reader.execute({
            userId,
            cursor: query.cursor,
            limit,
        });
    }
}
