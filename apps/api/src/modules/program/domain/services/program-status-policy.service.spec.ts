import { ProgramStatusPolicy } from './program-status-policy.service';

describe('ProgramStatusPolicy', () => {
    describe('허용 전이', () => {
        it.each([
            ['DRAFT', 'ACTIVE'],
            ['ACTIVE', 'INACTIVE'],
            ['INACTIVE', 'ACTIVE'],
        ] as const)('%s → %s 는 ALLOWED', (from, to) => {
            expect(ProgramStatusPolicy.evaluate(from, to)).toBe('ALLOWED');
        });
    });

    describe('동일 상태', () => {
        it.each(['DRAFT', 'ACTIVE', 'INACTIVE'] as const)('%s → 동일 상태는 SAME_STATUS', (s) => {
            expect(ProgramStatusPolicy.evaluate(s, s)).toBe('SAME_STATUS');
        });
    });

    describe('정의되지 않은 전이', () => {
        it.each([
            ['DRAFT', 'INACTIVE'],
            ['ACTIVE', 'DRAFT'],
            ['INACTIVE', 'DRAFT'],
        ] as const)('%s → %s 는 INVALID', (from, to) => {
            expect(ProgramStatusPolicy.evaluate(from, to)).toBe('INVALID');
        });
    });
});
