'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { ProgramStatus } from '@todam/shared';
import { Button } from '@todam/ui';

import {
    ClassListHeaderMenu,
    PartnerClassListItem,
    usePartnerPrograms,
} from '@/features/program/list';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { EmptyState } from '@/shared/ui';

// GET /partner/stores/:storeId/programs 연동 완료
export default function PartnerClassesPage() {
    const router = useRouter();
    const storeId = useSearchParams().get('storeId') ?? '';
    const { data, isLoading, isError } = usePartnerPrograms(storeId);

    // DRAFT(작성 중)는 목록 미표기. BE가 sortOrder asc로 선정렬 → filter는 순서 보존하므로 클라 재정렬 불필요.
    const programs = (data?.programs ?? []).filter((p) => p.status !== ProgramStatus.DRAFT);

    // 라우트 헤더(클래스 관리) 우측 슬롯에 메뉴 주입.
    useHeaderOverride({
        rightAction: <ClassListHeaderMenu programCount={programs.length} storeId={storeId} />,
    });

    return (
        <main className="flex-1 overflow-y-auto px-4 pb-16">
            {isLoading && (
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    클래스 목록을 불러오는 중입니다.
                </p>
            )}

            {isError && (
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    클래스 목록을 불러오지 못했습니다.
                    <br />
                    잠시 후 다시 시도해주세요.
                </p>
            )}

            {!isLoading && !isError && programs.length === 0 && (
                <div className="flex h-full items-center justify-center">
                    <EmptyState message="아직 등록된 클래스가 없습니다.">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/partner/classes/new?storeId=${storeId}`)}
                        >
                            클래스 등록하기
                        </Button>
                    </EmptyState>
                </div>
            )}

            {!isLoading && !isError && programs.length > 0 && (
                <section className="flex flex-col gap-3 py-2">
                    {programs.map((program) => (
                        <PartnerClassListItem
                            key={program.id}
                            program={program}
                            storeId={storeId}
                        />
                    ))}
                </section>
            )}
        </main>
    );
}
