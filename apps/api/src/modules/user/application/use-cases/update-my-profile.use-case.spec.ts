/// <reference types="jest" />
import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { BodyZodValidationPipe } from '../../../../common/pipes/body-zod-validation.pipe';
import { updateMyProfileBodySchema } from '@todam/shared';
import { UpdateMyProfileUseCase } from './update-my-profile.use-case';
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
        updatedAt: new Date('2026-05-24T18:10:00.000Z'),
        ...overrides,
    };
}

describe('UpdateMyProfileUseCase', () => {
    const findById = jest.fn();
    const existsByNicknameExceptUser = jest.fn();
    const updateNickname = jest.fn();

    const useCase = new UpdateMyProfileUseCase({
        findById,
        existsByNicknameExceptUser,
        updateNickname,
    } as never);

    beforeEach(() => {
        findById.mockReset();
        existsByNicknameExceptUser.mockReset();
        updateNickname.mockReset();
    });

    it('200: 정상 닉네임 수정 — userId/email/nickname/isPartner/updatedAt 포함', async () => {
        findById.mockResolvedValue(makeRow());
        existsByNicknameExceptUser.mockResolvedValue(false);
        updateNickname.mockResolvedValue(makeRow({ nickname: '새로운토담이' }));

        const result = await useCase.execute(USER_ID, '새로운토담이');

        expect(result.user.userId).toBe(USER_ID);
        expect(result.user.nickname).toBe('새로운토담이');
        expect(result.user.updatedAt).toBe('2026-05-24T18:10:00.000Z');
        // createdAt은 응답에 포함되지 않아야 함
        expect((result.user as Record<string, unknown>)['createdAt']).toBeUndefined();
    });

    it('200: 본인 현재 닉네임과 동일 — existsByNicknameExceptUser false → 통과', async () => {
        findById.mockResolvedValue(makeRow({ nickname: '토담이' }));
        existsByNicknameExceptUser.mockResolvedValue(false);
        updateNickname.mockResolvedValue(makeRow({ nickname: '토담이' }));

        const result = await useCase.execute(USER_ID, '토담이');

        expect(result.user.nickname).toBe('토담이');
        expect(updateNickname).toHaveBeenCalledWith(USER_ID, '토담이');
    });

    it('409: 다른 유저가 동일 닉네임 사용 중 → NICKNAME_ALREADY_EXISTS', async () => {
        findById.mockResolvedValue(makeRow());
        existsByNicknameExceptUser.mockResolvedValue(true);

        const err = await useCase.execute(USER_ID, '중복닉네임').catch((e: BusinessException) => e);

        expect((err as BusinessException).errorCode).toBe('NICKNAME_ALREADY_EXISTS');
        expect((err as BusinessException).getStatus()).toBe(HttpStatus.CONFLICT);
    });

    it('404: 유저 없음 → USER_NOT_FOUND', async () => {
        findById.mockResolvedValue(null);

        const err = await useCase.execute(USER_ID, '닉네임').catch((e: BusinessException) => e);

        expect((err as BusinessException).errorCode).toBe('USER_NOT_FOUND');
        expect((err as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('404: WITHDRAWN 유저 → USER_NOT_FOUND', async () => {
        findById.mockResolvedValue(makeRow({ status: 'WITHDRAWN' }));

        const err = await useCase.execute(USER_ID, '닉네임').catch((e: BusinessException) => e);

        expect((err as BusinessException).errorCode).toBe('USER_NOT_FOUND');
        expect((err as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    describe('400: 닉네임 정규식 위반 — BodyZodValidationPipe가 INVALID_REQUEST + contract 메시지 반환', () => {
        // 정규식 검증은 컨트롤러 BodyZodValidationPipe에서 처리(use-case 미도달).
        // 파이프 자체의 동작을 이 spec에서 단언해 contract 정합을 보장한다.
        const pipe = new BodyZodValidationPipe(updateMyProfileBodySchema);

        const invalidCases = [
            { label: '1자(너무 짧음)', value: '가' },
            { label: '11자(너무 김)', value: '가나다라마바사아자차카' },
            { label: '특수문자 포함', value: '닉네임!' },
            { label: '공백 포함', value: '닉 네임' },
            { label: '자모 단독', value: 'ㄱㄴ' },
            { label: '언더스코어(자동생성 닉네임 형식)', value: '사용자_1234' },
        ];

        it.each(invalidCases)(
            '$label → INVALID_REQUEST 400 + 닉네임 정규식 메시지',
            ({ value }) => {
                expect(() => pipe.transform({ nickname: value }, { type: 'body' })).toThrow(
                    expect.objectContaining({
                        errorCode: 'INVALID_REQUEST',
                        message: '닉네임은 한글·영문·숫자 2~10자여야 합니다.',
                    }),
                );
            },
        );

        it('유효 닉네임(2~10자, 한글) — 파이프 통과(예외 없음)', () => {
            expect(() => pipe.transform({ nickname: '토담이' }, { type: 'body' })).not.toThrow();
        });

        it('유효 닉네임(영숫자 혼합 10자) — 파이프 통과(예외 없음)', () => {
            expect(() =>
                pipe.transform({ nickname: 'abc123가나다라' }, { type: 'body' }),
            ).not.toThrow();
        });
    });
});
