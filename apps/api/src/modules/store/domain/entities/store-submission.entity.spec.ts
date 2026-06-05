import { StoreSubmission } from './store-submission.entity';
import type { StoreStatus } from '@todam/shared';

describe('StoreSubmission', () => {
    it.each(['DRAFT', 'REJECTED'] as `${StoreStatus}`[])(
        'allows %s stores to be submitted',
        (status) => {
            const store = new StoreSubmission('store-1', status, 'Todam', 'Seoul', true);

            expect(store.isSubmittable()).toBe(true);
        },
    );

    it('rejects stores outside the submission workflow', () => {
        const store = new StoreSubmission('store-1', 'PENDING', 'Todam', 'Seoul', true);

        expect(store.isSubmittable()).toBe(false);
    });

    it('reports every missing required field', () => {
        const store = new StoreSubmission('store-1', 'DRAFT', '', '', false);

        expect(store.missingRequiredFields()).toEqual(['name', 'address', 'thumbnail image']);
    });
});
