/// <reference types="jest" />
import { ValidationPipe } from '@nestjs/common';
import { updateMyProfileBodySchema, withdrawBodySchema } from '@todam/shared';
import { BodyZodValidationPipe } from '../../../../common/pipes/body-zod-validation.pipe';
import { UserController } from './user.controller';

describe('UserController PATCH /users/me validation', () => {
    it('전역 ValidationPipe 이후에도 nickname을 보존해 Zod 검증을 통과한다', async () => {
        const parameterTypes = Reflect.getMetadata(
            'design:paramtypes',
            UserController.prototype,
            'patchProfile',
        ) as unknown[];
        const bodyMetatype = parameterTypes[1] as new () => object;
        const globalPipe = new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        });
        const bodyPipe = new BodyZodValidationPipe(updateMyProfileBodySchema);

        const body = await globalPipe.transform(
            { nickname: 'taeseong12' },
            { type: 'body', metatype: bodyMetatype },
        );

        expect(bodyPipe.transform(body, { type: 'body' })).toEqual({ nickname: 'taeseong12' });
    });
});

describe('UserController DELETE /users/me validation', () => {
    it('전역 ValidationPipe 이후에도 password를 보존해 Zod 검증을 통과한다', async () => {
        const parameterTypes = Reflect.getMetadata(
            'design:paramtypes',
            UserController.prototype,
            'withdraw',
        ) as unknown[];
        const bodyMetatype = parameterTypes[1] as new () => object;
        const globalPipe = new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        });
        const bodyPipe = new BodyZodValidationPipe(withdrawBodySchema);

        const body = await globalPipe.transform(
            { password: 'password123!' },
            { type: 'body', metatype: bodyMetatype },
        );

        expect(bodyPipe.transform(body, { type: 'body' })).toEqual({
            password: 'password123!',
        });
    });

    it('body가 없는 소셜 유저 요청을 빈 객체로 정규화한다', () => {
        const bodyPipe = new BodyZodValidationPipe(withdrawBodySchema);

        expect(bodyPipe.transform(undefined, { type: 'body' })).toEqual({});
    });
});
