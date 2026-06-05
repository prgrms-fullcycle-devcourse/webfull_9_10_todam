import { Injectable } from '@nestjs/common';
import { StoreQueryReader } from '../../domain/repositories/store-query.reader';
import type { ListStoresQueryDto } from '../../presentation/dto/list-stores.dto';

@Injectable()
export class ListStoresUseCase {
    constructor(private readonly reader: StoreQueryReader) {}

    execute(query: ListStoresQueryDto) {
        return this.reader.listStores(query);
    }
}
