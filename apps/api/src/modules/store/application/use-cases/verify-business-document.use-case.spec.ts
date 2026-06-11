/// <reference types="jest" />

// @todam/config 는 src(TS/ESM)로 해석되어 jest transform 대상 밖이므로, import 전에 모킹.
// (transitive: use-case → NtsService → @todam/config)
jest.mock('@todam/config', () => ({
    createApiEnv: () => ({ NTS_API_KEY: 'test-api-key' }),
}));

import { VerifyBusinessDocumentUseCase } from './verify-business-document.use-case';
import { NtsService, NtsApiError } from '../../infrastructure/nts.service';
import { VerificationStatus, BusinessState } from '@todam/shared';

const mockValidateRes = (valid: '01' | '02', bStt?: string) => ({
    status_code: '200',
    data: [{ b_no: '1234567890', valid, ...(bStt ? { b_stt: bStt } : {}) }],
    _raw: {},
});

const mockStatusRes = (bStt: string) => ({
    status_code: '200',
    data: [{ b_no: '1234567890', b_stt: bStt, b_stt_cd: '' }],
    _raw: {},
});

describe('VerifyBusinessDocumentUseCase', () => {
    let useCase: VerifyBusinessDocumentUseCase;
    let nts: jest.Mocked<NtsService>;

    beforeEach(() => {
        nts = {
            validate: jest.fn(),
            getStatus: jest.fn(),
        } as unknown as jest.Mocked<NtsService>;
        useCase = new VerifyBusinessDocumentUseCase(nts);
    });

    describe('VERIFIED 경로 (b_stt 포함 — 1회 호출)', () => {
        it('valid=01, b_stt=계속사업자 → VERIFIED / ACTIVE', async () => {
            nts.validate.mockResolvedValue(mockValidateRes('01', '계속사업자'));
            const result = await useCase.execute('1234567890', '홍길동', '20190315');

            expect(result).toEqual({
                verificationStatus: VerificationStatus.VERIFIED,
                businessState: BusinessState.ACTIVE,
                message: 'VERIFIED',
            });
            expect(nts.getStatus).not.toHaveBeenCalled();
        });
    });

    describe('VERIFIED 경로 (b_stt 미포함 — 2회 호출)', () => {
        it('valid=01, b_stt 없음 → getStatus 호출 → 계속사업자 → VERIFIED / ACTIVE', async () => {
            nts.validate.mockResolvedValue(mockValidateRes('01'));
            nts.getStatus.mockResolvedValue(mockStatusRes('계속사업자'));

            const result = await useCase.execute('1234567890', '홍길동', '20190315');

            expect(nts.getStatus).toHaveBeenCalledWith('1234567890');
            expect(result).toEqual({
                verificationStatus: VerificationStatus.VERIFIED,
                businessState: BusinessState.ACTIVE,
                message: 'VERIFIED',
            });
        });
    });

    describe('MISMATCH 경로', () => {
        it('valid=02 → MISMATCH / businessState=null', async () => {
            nts.validate.mockResolvedValue(mockValidateRes('02'));
            const result = await useCase.execute('1234567890', '홍길동', '20190315');

            expect(result).toEqual({
                verificationStatus: VerificationStatus.MISMATCH,
                businessState: null,
                message: 'MISMATCH',
            });
        });
    });

    describe('CLOSED 경로', () => {
        it('valid=01, b_stt=폐업자 → VERIFIED(진위통과) / CLOSED / BUSINESS_CLOSED', async () => {
            nts.validate.mockResolvedValue(mockValidateRes('01', '폐업자'));
            const result = await useCase.execute('1234567890', '홍길동', '20190315');

            // 진위는 통과(VERIFIED), 등록 차단은 businessState/message가 담당.
            expect(result).toEqual({
                verificationStatus: VerificationStatus.VERIFIED,
                businessState: BusinessState.CLOSED,
                message: 'BUSINESS_CLOSED',
            });
        });
    });

    describe('SUSPENDED 경로', () => {
        it('valid=01, b_stt=휴업자 → VERIFIED(진위통과) / SUSPENDED / BUSINESS_SUSPENDED', async () => {
            nts.validate.mockResolvedValue(mockValidateRes('01', '휴업자'));
            const result = await useCase.execute('1234567890', '홍길동', '20190315');

            // 진위는 통과(VERIFIED), 등록 차단은 businessState/message가 담당.
            expect(result).toEqual({
                verificationStatus: VerificationStatus.VERIFIED,
                businessState: BusinessState.SUSPENDED,
                message: 'BUSINESS_SUSPENDED',
            });
        });
    });

    describe('NtsApiError → ERROR 경로', () => {
        it('validate에서 NtsApiError → ERROR / null / NTS_ERROR', async () => {
            nts.validate.mockRejectedValue(new NtsApiError('타임아웃'));
            const result = await useCase.execute('1234567890', '홍길동', '20190315');

            expect(result).toEqual({
                verificationStatus: VerificationStatus.ERROR,
                businessState: null,
                message: 'NTS_ERROR',
            });
        });

        it('getStatus에서 NtsApiError → ERROR / null / NTS_ERROR', async () => {
            nts.validate.mockResolvedValue(mockValidateRes('01'));
            nts.getStatus.mockRejectedValue(new NtsApiError('네트워크 오류'));

            const result = await useCase.execute('1234567890', '홍길동', '20190315');

            expect(result).toEqual({
                verificationStatus: VerificationStatus.ERROR,
                businessState: null,
                message: 'NTS_ERROR',
            });
        });

        it('NtsApiError가 아닌 예외는 그대로 throw', async () => {
            nts.validate.mockRejectedValue(new Error('unexpected'));

            await expect(useCase.execute('1234567890', '홍길동', '20190315')).rejects.toThrow(
                'unexpected',
            );
        });
    });

    describe('응답 data가 비어있는 경우', () => {
        it('data 배열이 비어있으면 MISMATCH', async () => {
            nts.validate.mockResolvedValue({
                status_code: '200',
                data: [],
                _raw: {},
            });
            const result = await useCase.execute('1234567890', '홍길동', '20190315');

            expect(result.verificationStatus).toBe(VerificationStatus.MISMATCH);
            expect(result.message).toBe('MISMATCH');
        });
    });
});
