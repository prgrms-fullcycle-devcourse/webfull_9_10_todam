'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ProgramStatus } from '@todam/shared';
import { Button } from '@todam/ui';

import { ProgramManagementItem } from '../../../entities/program';
import {
    ClassListHeaderMenu,
    usePartnerPrograms,
    type PartnerProgramListItemView,
} from '../../../features/program/list';
import { useHeaderActionStore } from '../../../shared/model';
import { EmptyState } from '../../../shared/ui';

// 현재 선택 공방 컨텍스트(전역 store 선택)는 미구현 단계.
// mock 단계에서는 시드 데이터가 있는 공방 id 로 고정해 화면을 렌더한다.
// 실 API 연동 시 선택된 공방 storeId 로 교체한다.
const MOCK_STORE_ID = 'store-seed-0001';

// 소요시간(분) → "N시간", "N시간 M분", "M분".
function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}시간 ${m}분`;
    if (h > 0) return `${h}시간`;
    return `${m}분`;
}

// 가격(원) → "45,000원".
function formatPrice(price: number): string {
    return `${price.toLocaleString('ko-KR')}원`;
}

// 서브텍스트 항목 구성. Contract 필드(durationMinutes) + mock 확장(level·leadTimeDays).
// 확장 필드가 없으면(실 API) 해당 항목을 생략한다.
function buildMetaItems(program: PartnerProgramListItemView): string[] {
    const items: string[] = [];
    if (program.level) items.push(program.level);
    items.push(formatDuration(program.durationMinutes));
    if (typeof program.leadTimeDays === 'number') items.push(`평균 ${program.leadTimeDays}일`);
    return items;
}

export default function PartnerClassesPage() {
    const router = useRouter();
    const { data, isLoading, isError } = usePartnerPrograms(MOCK_STORE_ID);
    // 클래스 관리 화면은 DRAFT(작성 중) UI 미표기 → 생략, ACTIVE/INACTIVE 만 sortOrder 오름차순 노출.
    const programs = (data?.programs ?? [])
        .filter((p) => p.status !== ProgramStatus.DRAFT)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    const setAction = useHeaderActionStore((s) => s.setAction);
    const clearAction = useHeaderActionStore((s) => s.clearAction);

    useEffect(() => {
        setAction(<ClassListHeaderMenu programCount={programs.length} />);
        return () => clearAction();
    }, [setAction, clearAction, programs.length]);

    return (
        <main className="flex-1 overflow-y-auto px-4 pb-16">
            {isLoading && (
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    클래스 목록을 불러오는 중입니다.
                </p>
            )}

            {isError && (
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    클래스 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                </p>
            )}

            {!isLoading && !isError && programs.length === 0 && (
                <EmptyState message="아직 등록된 클래스가 없습니다.">
                    <Button
                        variant="filled"
                        size="sm"
                        onClick={() => router.push('/partner/classes/new')}
                    >
                        클래스 등록하기
                    </Button>
                </EmptyState>
            )}

            {!isLoading && !isError && programs.length > 0 && (
                <section className="flex flex-col gap-3 py-2">
                    {programs.map((program) => (
                        <ProgramManagementItem
                            key={program.id}
                            programName={program.title}
                            metaItems={buildMetaItems(program)}
                            price={formatPrice(program.price)}
                            isClosed={program.status === ProgramStatus.INACTIVE}
                            role="button"
                            tabIndex={0}
                            onClick={() => router.push(`/partner/classes/${program.id}`)}
                            className="cursor-pointer text-left"
                        />
                    ))}
                </section>
            )}
        </main>
    );
}
