export type TerminatePartnerResult =
    | { outcome: 'TERMINATED'; partnerId: string; terminatedAt: Date }
    | { outcome: 'NOT_FOUND' }
    | { outcome: 'BLOCKED'; partnerId: string; reason: 'RESERVATION' | 'ARTWORK' };

export abstract class PartnerTerminationRepository {
    abstract terminate(userId: string): Promise<TerminatePartnerResult>;
}
