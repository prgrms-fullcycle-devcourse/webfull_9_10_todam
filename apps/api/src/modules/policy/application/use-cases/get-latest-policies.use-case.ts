import { Injectable } from '@nestjs/common';
import {
    PolicyVersionRepository,
    PolicyVersionRow,
} from '../../domain/repositories/policy-version.repository';

// 정렬 순서 (plan Decision 2 확정): TERMS_OF_SERVICE → PRIVACY_POLICY → LOCATION_BASED_SERVICE → MARKETING
// FE 바텀시트가 이 순서로 렌더링하므로 BE에서 보장한다.
const POLICY_TYPE_ORDER: Record<string, number> = {
    TERMS_OF_SERVICE: 0,
    PRIVACY_POLICY: 1,
    LOCATION_BASED_SERVICE: 2,
    MARKETING: 3,
};

@Injectable()
export class GetLatestPoliciesUseCase {
    constructor(private readonly policyVersions: PolicyVersionRepository) {}

    async execute(): Promise<PolicyVersionRow[]> {
        const rows = await this.policyVersions.findAllLatest();

        return rows.slice().sort((a, b) => {
            const orderA = POLICY_TYPE_ORDER[a.policyType] ?? 99;
            const orderB = POLICY_TYPE_ORDER[b.policyType] ?? 99;
            return orderA - orderB;
        });
    }
}
