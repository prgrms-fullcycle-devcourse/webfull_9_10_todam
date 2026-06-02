'use client';

import { useEffect } from 'react';

import { Button, Tag, RightIcon, BottomBar } from '@todam/ui';
import { ProgramDifficulty, ProgramStatus } from '@todam/shared';

import { useHeaderActionStore, useSheet } from '../../../../shared/model';
import { getDifficultyLabel } from '../../../../entities/program';
import { useProgramEditPreload } from '../../../../features/program/edit';
import { ClassEditSheet, ClassInfoTable } from '../../../../features/program/detail';

type PageProps = { params: Promise<{ id: string }> };

export default function PartnerClassDetailPage({ params }: PageProps) {
    const { programId, program, isLoading } = useProgramEditPreload(params);
    const { open: openSheet, close: closeSheet } = useSheet();

    // sub 헤더 기본 우측 알림 아이콘 숨김 (빈 action 주입으로 noti fallback 대체).
    const setAction = useHeaderActionStore((s) => s.setAction);
    const clearAction = useHeaderActionStore((s) => s.clearAction);
    useEffect(() => {
        setAction(<span aria-hidden />);
        return () => clearAction();
    }, [setAction, clearAction]);

    if (isLoading || !program) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <span className="text-sm text-foreground-tertiary">불러오는 중...</span>
            </div>
        );
    }

    const isPublished = program.status === ProgramStatus.ACTIVE;
    // reviewCount 는 리뷰 API 후행(임시 0)
    const reviewCount = 0;

    const handleCta = () => {
        if (!isPublished) return;
        openSheet(
            <ClassEditSheet
                programId={programId}
                title={program.title}
                reservationCount={12}
                onClose={closeSheet}
            />,
        );
    };

    return (
        <>
            <main className="flex-1 overflow-y-auto px-4 pb-16">
                {/* 대표 이미지 */}
                <div className="py-2">
                    <div className="relative flex h-44 w-full items-center justify-center overflow-hidden rounded-2xl bg-muted">
                        {program.images[0] ? (
                            <img
                                src={program.images[0].imageUrl}
                                alt={program.title}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <Tag>IMG</Tag>
                        )}
                    </div>
                </div>

                {/* 클래스 기본 정보 */}
                <section className="flex flex-col gap-3 py-2">
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-1">
                            <Tag className="!bg-primary-subtle !text-primary-darker">
                                {getDifficultyLabel(program.difficulty ?? ProgramDifficulty.BASIC)}
                            </Tag>
                            {program.featureTags.map((tag) => (
                                <Tag key={tag}>{tag}</Tag>
                            ))}
                        </div>
                        <h1 className="text-2xl font-extrabold leading-8 text-foreground">
                            {program.title}
                        </h1>
                    </div>

                    <button
                        type="button"
                        className="flex w-fit items-center text-sm font-semibold text-foreground"
                    >
                        클래스 리뷰 {reviewCount}개
                        <RightIcon size={16} />
                    </button>

                    {program.description && (
                        <p className="py-2 text-sm leading-[18px] text-foreground">
                            {program.description}
                        </p>
                    )}
                </section>

                {/* 클래스 상세 정보 테이블 */}
                <section className="py-2">
                    <ClassInfoTable program={program} />
                </section>
            </main>

            {/* 하단 고정 CTA */}
            <BottomBar>
                <Button variant="filled" size="lg" className="w-full" onClick={handleCta}>
                    {isPublished ? '클래스 정보 수정하기' : '클래스 게시하기'}
                </Button>
            </BottomBar>
        </>
    );
}
