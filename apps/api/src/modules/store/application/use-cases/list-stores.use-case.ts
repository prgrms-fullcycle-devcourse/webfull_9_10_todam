import { Injectable } from '@nestjs/common';
import { StoresReader, type ListStoresQuery } from '../../domain/repositories/store-readers';

@Injectable()
export class ListStoresUseCase {
    constructor(private readonly reader: StoresReader) {}

    execute(query: ListStoresQuery) {
        return this.reader.execute(query);
    }
}
