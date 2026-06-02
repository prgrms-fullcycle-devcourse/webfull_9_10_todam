'use client';

import { useRouter } from 'next/navigation';

import { ProgramStatus } from '@todam/shared';
import { Button } from '@todam/ui';

import {
    ClassListHeaderMenu,
    PartnerClassListItem,
    usePartnerPrograms,
} from '../../../features/program/list';
import { useHeaderOverride } from '../../../shared/lib/useHeaderOverride';
import { EmptyState } from '../../../shared/ui';

// 현재 선택 공방 컨텍스트(전역 store 선택)는 미구현 단계.
// mock 단계에서는 시드 데이터가 있는 공방 id 로 고정해 화면을 렌더한다.
// 실 API 연동 시 선택된 공방 storeId 로 교체한다.
const MOCK_STORE_ID = 'store-seed-0001';

export default function PartnerClassesPage() {
    const router = useRouter();
    const { data, isLoading, isError } = usePartnerPrograms(MOCK_STORE_ID);
    // 클래스 관리 화면은 DRAFT(작성 중) UI 미표기 → 생략, ACTIVE/INACTIVE 만 sortOrder 오름차순 노출.
    const programs = (data?.programs ?? [])
        .filter((p) => p.status !== ProgramStatus.DRAFT)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    // 라우트 헤더(클래스 관리) 우측 슬롯에 메뉴 주입.
    useHeaderOverride({ rightAction: <ClassListHeaderMenu programCount={programs.length} /> });

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
                <div className="flex h-full items-center justify-center">
                    <EmptyState message="아직 등록된 클래스가 없습니다.">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/partner/classes/new')}
                        >
                            클래스 등록하기
                        </Button>
                    </EmptyState>
                </div>
            )}

            {!isLoading && !isError && programs.length > 0 && (
                <section className="flex flex-col gap-3 py-2">
                    {programs.map((program) => (
                        <PartnerClassListItem key={program.id} program={program} />
                    ))}
                </section>
            )}
        </main>
    );
}
