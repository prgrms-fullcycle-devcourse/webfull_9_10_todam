'use client';

import { ProgramStatus, formatDuration, formatPrice } from '@todam/shared';
import { useRouter } from 'next/navigation';

import { ClassItem } from '@/entities/program';
import type { PartnerProgramListItemView } from '../api';

// 서브텍스트 항목 구성. Contract 필드(durationMinutes) + mock 확장(level·leadTimeDays).
// 확장 필드가 없으면(실 API) 해당 항목을 생략한다.
export function buildProgramMetaItems(program: PartnerProgramListItemView): string[] {
    const items: string[] = [];
    if (program.level) items.push(program.level);
    items.push(formatDuration(program.durationMinutes));
    if (typeof program.leadTimeDays === 'number')
        items.push(`작품 수령까지 평균 ${program.leadTimeDays}일`);
    return items;
}

type Props = {
    program: PartnerProgramListItemView;
};

// 파트너 클래스 목록 아이템. 클래스 관리·공방 상세에서 동일 형태로 사용.
// 클릭 시 클래스 상세로 이동.
export function PartnerClassListItem({ program }: Props) {
    const router = useRouter();
    return (
        <ClassItem
            programName={program.title}
            metaItems={buildProgramMetaItems(program)}
            price={formatPrice(program.price)}
            isClosed={program.status === ProgramStatus.INACTIVE}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/partner/classes/${program.id}`)}
            className="cursor-pointer text-left"
        />
    );
}
