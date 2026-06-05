import { StoreImagePolicy } from './store-image-policy.service';

describe('StoreImagePolicy', () => {
    it('allows images below the maximum', () => {
        expect(StoreImagePolicy.canAdd(StoreImagePolicy.MAX_IMAGES - 1)).toBe(true);
    });

    it('rejects images at the maximum', () => {
        expect(StoreImagePolicy.canAdd(StoreImagePolicy.MAX_IMAGES)).toBe(false);
    });
});
