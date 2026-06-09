/// <reference types="jest" />
import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { GetMyProfileUseCase } from './get-my-profile.use-case';
import type { UserProfileRow } from '../../domain/repositories/user.repository';

const USER_ID = 'eb50a73f-785f-49ce-887b-5f0bba67a1e3';

function makeRow(overrides: Partial<UserProfileRow> = {}): UserProfileRow {
    return {
        id: USER_ID,
        email: 'user@example.com',
        nickname: '토담이',
        isPartner: false,
        status: 'ACTIVE',
        createdAt: new Date('2026-05-24T16:55:00.000Z'),
        updatedAt: new Date('2026-05-24T16:55:00.000Z'),
        ...overrides,
    };
}

describe('GetMyProfileUseCase', () => {
    const findById = jest.fn();
    const useCase = new GetMyProfileUseCase({
        findById,
        existsByNicknameExceptUser: jest.fn(),
        updateNickname: jest.fn(),
    } as never);

    beforeEach(() => {
        findById.mockReset();
    });

    it('200: ACTIVE 유저 반환 — userId/email/nickname/isPartner/createdAt 포함', async () => {
        findById.mockResolvedValue(makeRow());

        const result = await useCase.execute(USER_ID);

        expect(result.user.userId).toBe(USER_ID);
        expect(result.user.email).toBe('user@example.com');
        expect(result.user.nickname).toBe('토담이');
        expect(result.user.isPartner).toBe(false);
        expect(result.user.createdAt).toBe('2026-05-24T16:55:00.000Z');
        // updatedAt은 응답에 포함되지 않아야 함
        expect((result.user as Record<string, unknown>)['updatedAt']).toBeUndefined();
    });

    it('404: 유저 없음 → USER_NOT_FOUND', async () => {
        findById.mockResolvedValue(null);

        await expect(useCase.execute(USER_ID)).rejects.toMatchObject({
            errorCode: 'USER_NOT_FOUND',
            getStatus: expect.any(Function),
        });

        const err = await useCase.execute(USER_ID).catch((e: BusinessException) => e);
        expect((err as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('404: WITHDRAWN 유저 → USER_NOT_FOUND', async () => {
        findById.mockResolvedValue(makeRow({ status: 'WITHDRAWN' }));

        const err = await useCase.execute(USER_ID).catch((e: BusinessException) => e);

        expect((err as BusinessException).errorCode).toBe('USER_NOT_FOUND');
        expect((err as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
});
