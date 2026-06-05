import { Injectable } from '@nestjs/common';
import { StoreQueryReader } from '../../domain/repositories/store-query.reader';

@Injectable()
export class ListStoreProgramsUseCase {
    constructor(private readonly reader: StoreQueryReader) {}

    execute(slug: string) {
        return this.reader.listStorePrograms(slug);
    }
}
