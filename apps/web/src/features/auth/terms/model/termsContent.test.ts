import { TERMS } from './termsContent';

describe('TERMS 약관 메타', () => {
    it('서비스·위치·개인정보 3종을 정의한다', () => {
        expect(TERMS.map((t) => t.key)).toEqual(['service', 'location', 'privacy']);
    });

    it('3종 모두 필수(required)다 — 사용자 확정(2026-06-11)', () => {
        expect(TERMS.every((t) => t.required)).toBe(true);
    });

    it('각 약관은 사용자에게 보일 label을 가진다', () => {
        for (const term of TERMS) {
            expect(term.label.length).toBeGreaterThan(0);
        }
    });
});
