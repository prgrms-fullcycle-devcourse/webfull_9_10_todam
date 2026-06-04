'use client';

import { ProgramStatus, formatDuration, formatPrice } from '@todam/shared';
import { useRouter } from 'next/navigation';

import { ClassItem, getDifficultyLabel } from '@/entities/program';
import type { PartnerProgramListItemView } from '../api';

export function buildProgramMetaItems(program: PartnerProgramListItemView): string[] {
    return [
        getDifficultyLabel(program.difficulty),
        formatDuration(program.durationMinutes),
        `작품 수령까지 평균 ${program.leadTimeDays}일`,
    ];
}

type Props = {
    program: PartnerProgramListItemView;
    storeId: string;
};

// 파트너 클래스 목록 아이템
export function PartnerClassListItem({ program, storeId }: Props) {
    const router = useRouter();
    return (
        <ClassItem
            programName={program.title}
            metaItems={buildProgramMetaItems(program)}
            price={formatPrice(program.price)}
            isClosed={program.status === ProgramStatus.INACTIVE}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/partner/classes/${program.id}?storeId=${storeId}`)}
            className="cursor-pointer text-left"
        />
    );
}
