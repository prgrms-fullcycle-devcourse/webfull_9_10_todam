import { CDN_BASE, keyFromImageUrl } from './s3-object.util';

describe('s3-object.util', () => {
    describe('keyFromImageUrl', () => {
        const key = 'programs/program-id/images/image.png';

        it('extracts an object key from a CDN URL', () => {
            expect(keyFromImageUrl(`${CDN_BASE}/${key}`)).toBe(key);
        });

        it('extracts an object key from a legacy S3 URL', () => {
            expect(
                keyFromImageUrl(`https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/${key}`),
            ).toBe(key);
        });

        it('keeps an object key unchanged', () => {
            expect(keyFromImageUrl(key)).toBe(key);
        });
    });
});
