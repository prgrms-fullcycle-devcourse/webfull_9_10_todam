import { Injectable } from '@nestjs/common';
import { PartnerOnboardingReader } from '../../domain/repositories/store-readers';

@Injectable()
export class GetPartnerOnboardingUseCase {
    constructor(private readonly reader: PartnerOnboardingReader) {}

    execute(userId: string) {
        return this.reader.execute(userId);
    }
}
