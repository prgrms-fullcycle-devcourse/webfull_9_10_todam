import { ProgramStatus } from '@todam/shared';
import type { BadgeTone } from '@todam/ui';

// 클래스 status enum → 라벨/톤 매핑 (CONTRACT-4 SSOT). 순수 도메인 표현 매핑(페치·라우팅 없음 → entities).
// 라벨 문구는 UI-1(디자인) 미확정 → 명세 설명문 기반 잠정값. 디자인 확정 시 이 표만 교체.
//  DRAFT(작성 중) / ACTIVE(예약 가능·퍼블릭 노출) / INACTIVE(일시 중단·신규 예약 불가)
export const PROGRAM_STATUS_BADGE: Record<ProgramStatus, { label: string; tone: BadgeTone }> = {
    [ProgramStatus.DRAFT]: { label: '작성 중', tone: 'neutral' },
    [ProgramStatus.ACTIVE]: { label: '예약 가능', tone: 'success' },
    [ProgramStatus.INACTIVE]: { label: '일시 중단', tone: 'danger' },
};

export function getProgramStatusBadge(status: ProgramStatus) {
    return PROGRAM_STATUS_BADGE[status];
}
