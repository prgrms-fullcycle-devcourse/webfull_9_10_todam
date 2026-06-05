import { StoreSubmission } from '../entities/store-submission.entity';
import type { StoreStatus } from '@todam/shared/src/enums/store-status';

export interface StoreStatusUpdate {
    id: string;
    status: `${StoreStatus}`;
    updatedAt: Date;
}

export abstract class StoreRepository {
    abstract findSubmission(storeId: string): Promise<StoreSubmission | null>;
    abstract markPending(storeId: string): Promise<StoreStatusUpdate>;
}
