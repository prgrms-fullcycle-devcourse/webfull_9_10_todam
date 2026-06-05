import { Injectable } from '@nestjs/common';
import { StoreProgramsReader } from '../../domain/repositories/store-readers';

@Injectable()
export class ListStoreProgramsUseCase {
    constructor(private readonly reader: StoreProgramsReader) {}

    execute(slug: string) {
        return this.reader.execute(slug);
    }
}
