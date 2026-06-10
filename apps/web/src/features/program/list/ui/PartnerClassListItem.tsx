'use client';

import { ProgramStatus, formatDuration, formatPrice } from '@todam/shared';
import type { PartnerProgramListItem } from '@todam/shared';
import Link from 'next/link';

import { ClassItem, getDifficultyLabel } from '@/entities/program';

type Props = {
    program: PartnerProgramListItem;
};

// 파트너 클래스 목록 아이템. 클릭 시 클래스 관리 상세(/partner/classes/:id)로 이동.
// 닫힌(INACTIVE) 클래스도 상세 진입은 가능 — dim 표기만, 이동은 막지 않음.
export function PartnerClassListItem({ program }: Props) {
    const metaItems = [
        getDifficultyLabel(program.difficulty),
        formatDuration(program.durationMinutes),
        `작품 수령까지 평균 ${program.leadTimeDays}일`,
    ];
    return (
        <Link href={`/partner/classes/${program.id}`} className="block">
            <ClassItem
                programName={program.title}
                metaItems={metaItems}
                price={formatPrice(program.price)}
                isClosed={program.status === ProgramStatus.INACTIVE}
            />
        </Link>
    );
}
