/// <reference types="jest" />
import { ValidationPipe } from '@nestjs/common';
import { reviewImageUploadRequestSchema, reviewWriteRequestSchema } from '@todam/shared';
import { BodyZodValidationPipe } from '../../../../common/pipes/body-zod-validation.pipe';
import { ReviewController } from './review.controller';

jest.mock('../../application/use-cases/issue-review-image-presigned.use-case');
jest.mock('@todam/config', () => ({ createApiEnv: jest.fn() }));

const globalPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
});

async function validateBody(
    method: keyof ReviewController,
    bodyIndex: number,
    schema: typeof reviewWriteRequestSchema | typeof reviewImageUploadRequestSchema,
    body: object,
) {
    const parameterTypes = Reflect.getMetadata(
        'design:paramtypes',
        ReviewController.prototype,
        method,
    ) as unknown[];
    const bodyMetatype = parameterTypes[bodyIndex] as new () => object;
    const validatedByGlobalPipe = await globalPipe.transform(body, {
        type: 'body',
        metatype: bodyMetatype,
    });

    return new BodyZodValidationPipe(schema).transform(validatedByGlobalPipe, { type: 'body' });
}

describe('ReviewController request validation', () => {
    it('preserves review fields before create validation', async () => {
        const body = { rating: 5, content: '좋았어요', photos: ['reviews/photos/photo.jpg'] };

        await expect(
            validateBody('createReviewHandler', 2, reviewWriteRequestSchema, body),
        ).resolves.toEqual(body);
    });

    it('preserves review fields before update validation', async () => {
        const body = { rating: 4, content: '수정했어요' };

        await expect(
            validateBody('updateReviewHandler', 2, reviewWriteRequestSchema, body),
        ).resolves.toEqual(body);
    });

    it('preserves image fields before presigned validation', async () => {
        const body = { fileName: 'review.jpg', fileType: 'image/jpeg' };

        await expect(
            validateBody('issuePresignedHandler', 1, reviewImageUploadRequestSchema, body),
        ).resolves.toEqual(body);
    });
});
