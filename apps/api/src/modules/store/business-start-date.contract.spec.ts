/// <reference types="jest" />
import {
    createStoreBusinessDocumentSchema,
    businessDocumentUpdateRequestSchema,
} from '@todam/shared';

// 개업일자(startDate) 검증 계약 — 8자리 형식 + 실제 달력 날짜.
describe('startDate 개업일자 검증', () => {
    const base = {
        businessNumber: '5555555555',
        businessName: '흙담',
        ownerName: '김리듬',
        businessAddress: '서울특별시 성동구 둑섬로 273',
    };

    describe('createStoreBusinessDocumentSchema', () => {
        it('실제 존재하는 날짜는 통과한다', () => {
            expect(
                createStoreBusinessDocumentSchema.safeParse({ ...base, startDate: '20190315' })
                    .success,
            ).toBe(true);
        });

        it('미입력(null)은 허용된다', () => {
            expect(
                createStoreBusinessDocumentSchema.safeParse({ ...base, startDate: null }).success,
            ).toBe(true);
        });

        it.each(['20261399', '20260230', '20191333', '2019031', 'abcdefgh'])(
            '비정상 날짜 "%s"는 거부한다',
            (bad) => {
                expect(
                    createStoreBusinessDocumentSchema.safeParse({ ...base, startDate: bad })
                        .success,
                ).toBe(false);
            },
        );
    });

    describe('businessDocumentUpdateRequestSchema (반려 후 재수정)', () => {
        it('실제 날짜로 startDate 수정이 가능하다', () => {
            expect(
                businessDocumentUpdateRequestSchema.safeParse({ startDate: '20240101' }).success,
            ).toBe(true);
        });

        it('비정상 날짜는 거부한다', () => {
            expect(
                businessDocumentUpdateRequestSchema.safeParse({ startDate: '20260230' }).success,
            ).toBe(false);
        });
    });
});
