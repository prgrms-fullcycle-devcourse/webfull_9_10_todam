import { adminStoreRejectRequestSchema } from '@todam/shared';
import { AdminStoreRejectValidationPipe } from './admin-store-reject-validation.pipe';

describe('AdminStoreRejectValidationPipe', () => {
    const pipe = new AdminStoreRejectValidationPipe(adminStoreRejectRequestSchema);

    it('maps a missing reason to the contract error code', () => {
        expect(() => pipe.transform({}, { type: 'body' })).toThrow(
            expect.objectContaining({ errorCode: 'REJECTION_REASON_REQUIRED' }),
        );
    });

    it('accepts a non-empty rejection reason', () => {
        expect(
            pipe.transform({ rejectedReason: '서류가 불명확합니다.' }, { type: 'body' }),
        ).toEqual({
            rejectedReason: '서류가 불명확합니다.',
        });
    });
});
