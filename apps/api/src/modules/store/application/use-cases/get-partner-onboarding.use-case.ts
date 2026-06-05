import { Injectable } from '@nestjs/common';
import { StoreQueryReader } from '../../domain/repositories/store-query.reader';

@Injectable()
export class GetPartnerOnboardingUseCase {
    constructor(private readonly reader: StoreQueryReader) {}

    execute(userId: string) {
        return this.reader.getPartnerOnboarding(userId);
    }
}
