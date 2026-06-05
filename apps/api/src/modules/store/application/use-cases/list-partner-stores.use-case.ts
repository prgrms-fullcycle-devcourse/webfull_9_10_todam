import { Injectable } from '@nestjs/common';
import { PartnerStoresReader } from '../../domain/repositories/store-readers';

@Injectable()
export class ListPartnerStoresUseCase {
    constructor(private readonly reader: PartnerStoresReader) {}

    execute(userId: string) {
        return this.reader.execute(userId);
    }
}
