import { HttpStatus, Injectable } from '@nestjs/common';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { StoreRepository } from '../../domain/repositories/store.repository';
import type { SubmitStoreResult } from '../dto/store-application.dto';

@Injectable()
export class SubmitStoreUseCase {
    constructor(
        private readonly ownership: StoreOwnershipService,
        private readonly stores: StoreRepository,
    ) {}

    async execute(userId: string, storeId: string): Promise<SubmitStoreResult> {
        await this.ownership.verify(userId, storeId, { notFound: 'NOT_FOUND' });

        const store = await this.stores.findSubmission(storeId);
        if (!store) {
            throw new BusinessException(
                'NOT_FOUND',
                '공방을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        if (!store.isSubmittable()) {
            throw new BusinessException(
                'INVALID_STORE_STATUS',
                'DRAFT 또는 REJECTED 상태의 공방만 제출할 수 있습니다.',
                HttpStatus.CONFLICT,
            );
        }

        const missingFields = store.missingRequiredFields();
        if (missingFields.length > 0) {
            throw new BusinessException(
                'MISSING_REQUIRED_FIELDS',
                `필수 정보가 누락되었습니다: ${missingFields.join(', ')}`,
                HttpStatus.BAD_REQUEST,
            );
        }

        const updated = await this.stores.markPending(storeId);
        return {
            store: {
                id: updated.id,
                status: updated.status,
                updatedAt: updated.updatedAt.toISOString(),
            },
        };
    }
}
