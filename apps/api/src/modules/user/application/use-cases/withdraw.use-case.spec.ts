/// <reference types="jest" />
import { HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { WithdrawUseCase } from './withdraw.use-case';
import type { WithdrawTargetRow } from '../../domain/repositories/user.repository';

const USER_ID = 'eb50a73f-785f-49ce-887b-5f0bba67a1e3';
const PASSWORD_PLAIN = 'Password1234!';

async function makeHashedPassword(): Promise<string> {
    return bcrypt.hash(PASSWORD_PLAIN, 10);
}

function makeTarget(overrides: Partial<WithdrawTargetRow> = {}): WithdrawTargetRow {
    return {
        id: USER_ID,
        password: null, // 기본값 소셜(null)
        status: 'ACTIVE',
        ...overrides,
    };
}

function makeRepo(overrides: Partial<Record<string, jest.Mock>> = {}) {
    return {
        findById: jest.fn(),
        existsByNicknameExceptUser: jest.fn(),
        updateNickname: jest.fn(),
        findWithdrawTarget: jest.fn(),
        hasActivePartner: jest.fn().mockResolvedValue(false),
        hasActiveReservations: jest.fn().mockResolvedValue(false),
        hasActiveArtworks: jest.fn().mockResolvedValue(false),
        withdraw: jest.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

describe('WithdrawUseCase', () => {
    describe('이메일 유저 정상 탈퇴', () => {
        it('bcrypt 일치 → withdraw 호출', async () => {
            const hashedPw = await makeHashedPassword();
            const repo = makeRepo({
                findWithdrawTarget: jest.fn().mockResolvedValue(makeTarget({ password: hashedPw })),
            });
            const useCase = new WithdrawUseCase(repo as never);

            await useCase.execute(USER_ID, { password: PASSWORD_PLAIN });

            expect(repo.withdraw).toHaveBeenCalledWith(USER_ID);
        });
    });

    describe('이메일 유저 비밀번호 불일치', () => {
        it('bcrypt 불일치 → 400 PASSWORD_MISMATCH', async () => {
            const hashedPw = await makeHashedPassword();
            const repo = makeRepo({
                findWithdrawTarget: jest.fn().mockResolvedValue(makeTarget({ password: hashedPw })),
            });
            const useCase = new WithdrawUseCase(repo as never);

            const err = await useCase
                .execute(USER_ID, { password: 'WrongPassword!' })
                .catch((e: BusinessException) => e);

            expect((err as BusinessException).errorCode).toBe('PASSWORD_MISMATCH');
            expect((err as BusinessException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('이메일 유저 password body 누락', () => {
        it('password 없으면 → 400 PASSWORD_MISMATCH', async () => {
            const hashedPw = await makeHashedPassword();
            const repo = makeRepo({
                findWithdrawTarget: jest.fn().mockResolvedValue(makeTarget({ password: hashedPw })),
            });
            const useCase = new WithdrawUseCase(repo as never);

            const err = await useCase.execute(USER_ID, {}).catch((e: BusinessException) => e);

            expect((err as BusinessException).errorCode).toBe('PASSWORD_MISMATCH');
            expect((err as BusinessException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('소셜 유저 정상 탈퇴', () => {
        it('password=null → 본인확인 생략 → withdraw 호출', async () => {
            const repo = makeRepo({
                findWithdrawTarget: jest.fn().mockResolvedValue(makeTarget({ password: null })),
            });
            const useCase = new WithdrawUseCase(repo as never);

            await useCase.execute(USER_ID, {});

            expect(repo.withdraw).toHaveBeenCalledWith(USER_ID);
        });
    });

    describe('파트너 보유 차단', () => {
        it('ACTIVE_PARTNER_EXISTS → 400', async () => {
            const repo = makeRepo({
                findWithdrawTarget: jest.fn().mockResolvedValue(makeTarget()),
                hasActivePartner: jest.fn().mockResolvedValue(true),
            });
            const useCase = new WithdrawUseCase(repo as never);

            const err = await useCase.execute(USER_ID, {}).catch((e: BusinessException) => e);

            expect((err as BusinessException).errorCode).toBe('ACTIVE_PARTNER_EXISTS');
            expect((err as BusinessException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('진행 중 예약 차단', () => {
        it('hasActiveReservations=true → 400 ACTIVE_RESERVATIONS_OR_ARTWORKS_EXIST', async () => {
            const repo = makeRepo({
                findWithdrawTarget: jest.fn().mockResolvedValue(makeTarget()),
                hasActiveReservations: jest.fn().mockResolvedValue(true),
            });
            const useCase = new WithdrawUseCase(repo as never);

            const err = await useCase.execute(USER_ID, {}).catch((e: BusinessException) => e);

            expect((err as BusinessException).errorCode).toBe(
                'ACTIVE_RESERVATIONS_OR_ARTWORKS_EXIST',
            );
            expect((err as BusinessException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('제작 중 작품 차단', () => {
        it('hasActiveArtworks=true → 400 ACTIVE_RESERVATIONS_OR_ARTWORKS_EXIST', async () => {
            const repo = makeRepo({
                findWithdrawTarget: jest.fn().mockResolvedValue(makeTarget()),
                hasActiveArtworks: jest.fn().mockResolvedValue(true),
            });
            const useCase = new WithdrawUseCase(repo as never);

            const err = await useCase.execute(USER_ID, {}).catch((e: BusinessException) => e);

            expect((err as BusinessException).errorCode).toBe(
                'ACTIVE_RESERVATIONS_OR_ARTWORKS_EXIST',
            );
            expect((err as BusinessException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('비활성 유저 (WITHDRAWN)', () => {
        it('status=WITHDRAWN → 404 USER_NOT_FOUND', async () => {
            const repo = makeRepo({
                findWithdrawTarget: jest
                    .fn()
                    .mockResolvedValue(makeTarget({ status: 'WITHDRAWN' })),
            });
            const useCase = new WithdrawUseCase(repo as never);

            const err = await useCase.execute(USER_ID, {}).catch((e: BusinessException) => e);

            expect((err as BusinessException).errorCode).toBe('USER_NOT_FOUND');
            expect((err as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
        });
    });

    describe('유저 없음', () => {
        it('findWithdrawTarget=null → 404 USER_NOT_FOUND', async () => {
            const repo = makeRepo({
                findWithdrawTarget: jest.fn().mockResolvedValue(null),
            });
            const useCase = new WithdrawUseCase(repo as never);

            const err = await useCase.execute(USER_ID, {}).catch((e: BusinessException) => e);

            expect((err as BusinessException).errorCode).toBe('USER_NOT_FOUND');
            expect((err as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
        });
    });
});
