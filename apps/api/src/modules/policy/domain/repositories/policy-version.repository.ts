// ─── PolicyVersion 도메인 Repository (port) ──────────────────────────────
// 구현체: PrismaPolicyVersionRepository (infrastructure/persistence)

export interface PolicyVersionRow {
    policyType: string;
    version: string;
    url: string;
    effectiveAt: Date;
}

export abstract class PolicyVersionRepository {
    /** is_latest = true 인 PolicyVersion 행 전체를 반환한다. */
    abstract findAllLatest(): Promise<PolicyVersionRow[]>;
}
