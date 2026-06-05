import type { ProgramStatus } from '../repositories/program.repository';

// 상태 전이 평가 결과.
// - ALLOWED: 허용된 전이
// - SAME_STATUS: 현재와 동일한 상태로의 변경(불허)
// - INVALID: 정의되지 않은 전이(불허)
export type ProgramStatusTransition = 'ALLOWED' | 'SAME_STATUS' | 'INVALID';

/**
 * 클래스 상태 전이 도메인 정책.
 * 유효 전이: DRAFT → ACTIVE, ACTIVE → INACTIVE, INACTIVE → ACTIVE.
 */
export class ProgramStatusPolicy {
    private static readonly VALID_TRANSITIONS: Record<ProgramStatus, ProgramStatus[]> = {
        DRAFT: ['ACTIVE'],
        ACTIVE: ['INACTIVE'],
        INACTIVE: ['ACTIVE'],
    };

    static evaluate(from: ProgramStatus, to: ProgramStatus): ProgramStatusTransition {
        if (from === to) return 'SAME_STATUS';
        return ProgramStatusPolicy.VALID_TRANSITIONS[from].includes(to) ? 'ALLOWED' : 'INVALID';
    }
}
