/// <reference types="jest" />

// @todam/config 는 src(TS/ESM)로 jest transform 대상 밖이므로 import 전에 모킹.
// (transitive: command → NtsService → @todam/config)
jest.mock('@todam/config', () => ({
    createApiEnv: () => ({ NTS_API_KEY: 'test-api-key' }),
}));

import { VerificationStatus, BusinessState } from '@prisma/client';
import { PrismaCreateStoreCommand } from './prisma-create-store.command';
import { NtsService, NtsApiError } from '../nts.service';

const mockValidateRes = (valid: string, bStt?: string) => ({
    status_code: '200',
    data: [{ b_no: '5555555555', valid, ...(bStt ? { b_stt: bStt } : {}) }],
    _raw: {},
});

// store.create 에 넘어간 businessDocs.create 페이로드를 꺼낸다.
type CreatedDoc = {
    verificationStatus: VerificationStatus;
    verifiedAt: Date | null;
    verificationCheckedAt: Date | null;
    businessState: BusinessState | null;
};

describe('PrismaCreateStoreCommand — 진위확인 저장 분기', () => {
    let command: PrismaCreateStoreCommand;
    let prisma: {
        store: { findUnique: jest.Mock; create: jest.Mock };
        partner: { findUnique: jest.Mock; create: jest.Mock };
    };
    let nts: jest.Mocked<NtsService>;

    const baseDto = (startDate?: string) => ({
        name: '토담 공방',
        phone: '02-1234-5678',
        address: '서울시 성동구',
        latitude: 37.5,
        longitude: 127.0,
        convenienceInfo: { parking: true },
        autoConfirm: false,
        cancelDeadlineDays: 1,
        reservationIntervalMinutes: 60,
        maxCapacityPerSlot: 6,
        operatingHours: [{ dayOfWeek: 'MON', openTime: '10:00', closeTime: '19:00' }],
        businessDocument: {
            ownerName: '테스터',
            businessName: '흙담',
            businessNumber: '5555555555',
            businessAddress: '서울시 성동구',
            startDate, // 주입
        },
    });

    const runAndGetDoc = async (startDate?: string): Promise<CreatedDoc> => {
        await command.execute('user-1', baseDto(startDate) as never);
        return prisma.store.create.mock.calls[0][0].data.businessDocs.create as CreatedDoc;
    };

    beforeEach(() => {
        prisma = {
            store: {
                findUnique: jest.fn().mockResolvedValue(null),
                create: jest.fn().mockResolvedValue({
                    id: 's1',
                    partnerId: 'p1',
                    name: '토담 공방',
                    slug: 'todam',
                    status: 'DRAFT',
                    createdAt: new Date(),
                }),
            },
            partner: {
                findUnique: jest.fn().mockResolvedValue({ id: 'p1', status: 'APPROVED' }),
                create: jest.fn(),
            },
        };
        nts = { validate: jest.fn(), getStatus: jest.fn() } as unknown as jest.Mocked<NtsService>;
        command = new PrismaCreateStoreCommand(prisma as never, {} as never, nts);
    });

    it('startDate 없음 → 국세청 미호출, PENDING + verificationCheckedAt=null', async () => {
        const doc = await runAndGetDoc(undefined);

        expect(nts.validate).not.toHaveBeenCalled();
        expect(doc.verificationStatus).toBe(VerificationStatus.PENDING);
        expect(doc.verificationCheckedAt).toBeNull();
        expect(doc.verifiedAt).toBeNull();
        expect(doc.businessState).toBeNull();
    });

    it('valid=02 → MISMATCH + checkedAt 기록 + verifiedAt=null', async () => {
        nts.validate.mockResolvedValue(mockValidateRes('02'));
        const doc = await runAndGetDoc('20190315');

        expect(doc.verificationStatus).toBe(VerificationStatus.MISMATCH);
        expect(doc.verificationCheckedAt).toBeInstanceOf(Date);
        expect(doc.verifiedAt).toBeNull();
        expect(doc.businessState).toBeNull();
    });

    it('valid=01 + 계속사업자 → VERIFIED/ACTIVE + verifiedAt 기록', async () => {
        nts.validate.mockResolvedValue(mockValidateRes('01', '계속사업자'));
        const doc = await runAndGetDoc('20190315');

        expect(doc.verificationStatus).toBe(VerificationStatus.VERIFIED);
        expect(doc.businessState).toBe(BusinessState.ACTIVE);
        expect(doc.verifiedAt).toBeInstanceOf(Date);
        expect(doc.verificationCheckedAt).toBeInstanceOf(Date);
    });

    it('valid=01 + 폐업자 → VERIFIED/CLOSED + verifiedAt 기록(진위 통과)', async () => {
        nts.validate.mockResolvedValue(mockValidateRes('01', '폐업자'));
        const doc = await runAndGetDoc('20190315');

        expect(doc.verificationStatus).toBe(VerificationStatus.VERIFIED);
        expect(doc.businessState).toBe(BusinessState.CLOSED);
        expect(doc.verifiedAt).toBeInstanceOf(Date);
    });

    it('valid=01 + 휴업자 → VERIFIED/SUSPENDED', async () => {
        nts.validate.mockResolvedValue(mockValidateRes('01', '휴업자'));
        const doc = await runAndGetDoc('20190315');

        expect(doc.verificationStatus).toBe(VerificationStatus.VERIFIED);
        expect(doc.businessState).toBe(BusinessState.SUSPENDED);
    });

    it('valid=01 + 알 수 없는 b_stt → ERROR(fail-closed) + verifiedAt=null', async () => {
        nts.validate.mockResolvedValue(mockValidateRes('01', '알수없는상태'));
        const doc = await runAndGetDoc('20190315');

        expect(doc.verificationStatus).toBe(VerificationStatus.ERROR);
        expect(doc.businessState).toBeNull();
        expect(doc.verifiedAt).toBeNull();
    });

    it('NtsApiError → ERROR + checkedAt 기록(제출은 막지 않음)', async () => {
        nts.validate.mockRejectedValue(new NtsApiError('타임아웃'));
        const doc = await runAndGetDoc('20190315');

        expect(doc.verificationStatus).toBe(VerificationStatus.ERROR);
        expect(doc.verificationCheckedAt).toBeInstanceOf(Date);
        expect(doc.verifiedAt).toBeNull();
        expect(doc.businessState).toBeNull();
    });
});
