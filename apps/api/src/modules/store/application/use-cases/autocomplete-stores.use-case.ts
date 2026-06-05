import { Injectable } from '@nestjs/common';
import { AutocompleteStoresReader } from '../../domain/repositories/store-readers';

@Injectable()
export class AutocompleteStoresUseCase {
    constructor(private readonly reader: AutocompleteStoresReader) {}

    execute(keyword: string | undefined) {
        return this.reader.execute(keyword);
    }
}
