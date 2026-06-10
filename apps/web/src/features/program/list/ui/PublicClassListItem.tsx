'use client';

import { formatDuration, formatPrice } from '@todam/shared';
import type { PublicProgramListItem } from '@todam/shared';
import Link from 'next/link';

import { ClassItem, getDifficultyLabel } from '@/entities/program';

type Props = {
    program: PublicProgramListItem;
    slug: string;
    storeName: string;
};

// 공방 상세(고객) 운영 클래스 목록 아이템. 클릭 시 클래스 상세(/classes/:id)로 이동.
export function PublicClassListItem({ program, slug, storeName }: Props) {
    const metaItems = [
        getDifficultyLabel(program.difficulty),
        formatDuration(program.durationMinutes),
        `평균 ${program.leadTimeDays}일`,
    ];
    return (
        <Link
            href={`/classes/${program.id}?store=${encodeURIComponent(slug)}&storeName=${encodeURIComponent(storeName)}`}
            className="block"
        >
            <ClassItem
                programName={program.title}
                metaItems={metaItems}
                price={formatPrice(program.price)}
            />
        </Link>
    );
}
