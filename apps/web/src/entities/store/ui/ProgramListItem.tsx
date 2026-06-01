import { ProgramStatus, type PartnerProgramListItem } from '@todam/shared';

import { getProgramStatusBadge } from '../model/program-status-label';

// 메타줄 구분자(가운뎃점). operating-days 포맷과 동일 문자 사용.
const META_SEPARATOR = '・';

export type ProgramListItemProps = {
    program: PartnerProgramListItem;
    // store.operatingHours에서 도출한 한글 요일 문자열(예 "월·수·금"). page/model에서 만들어 전달.
    operatingDays: string;
};

// 운영 클래스 목록 카드 (Figma ClassItem 확정 스펙). 순수 표현 컴포넌트(props만).
// 썸네일·상태 배지 제거 → 상태는 메타줄 label로만 노출. day는 prop으로 받는다(데이터 페치 금지).
export function ProgramListItem({ program, operatingDays }: ProgramListItemProps) {
    const statusLabel = getProgramStatusBadge(program.status).label;
    const hours = `${program.durationMinutes}분`;
    const meta = [statusLabel, hours, operatingDays].filter(Boolean).join(META_SEPARATOR);

    // INACTIVE(일시 중단)는 dimmed 처리. DRAFT/ACTIVE는 기본.
    const isClosed = program.status === ProgramStatus.INACTIVE;

    return (
        <div className="flex w-full items-center gap-3 rounded-2xl border border-border-subtle bg-surface p-4">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span
                    className={
                        isClosed
                            ? 'truncate text-base font-semibold leading-5 text-foreground-tertiary'
                            : 'truncate text-base font-semibold leading-5 text-foreground'
                    }
                >
                    {program.title}
                </span>
                <span className="truncate text-xs font-normal leading-4 text-foreground-tertiary">
                    {meta}
                </span>
            </div>
            <span
                className={
                    isClosed
                        ? 'shrink-0 text-base font-medium leading-5 text-foreground-tertiary'
                        : 'shrink-0 text-base font-medium leading-5 text-foreground'
                }
            >
                {program.price.toLocaleString('ko-KR')}원
            </span>
        </div>
    );
}
