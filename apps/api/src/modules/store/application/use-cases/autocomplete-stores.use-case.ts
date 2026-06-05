import { Injectable } from '@nestjs/common';
import { StoreQueryReader } from '../../domain/repositories/store-query.reader';

@Injectable()
export class AutocompleteStoresUseCase {
    constructor(private readonly reader: StoreQueryReader) {}

    execute(keyword: string | undefined) {
        return this.reader.autocomplete(keyword);
    }
}
