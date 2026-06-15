'use client';

import { BottomBar, Button, RightIcon, Tag } from '@todam/ui';
import { ProgramDifficulty, ProgramStatus } from '@todam/shared';
import { useParams, useRouter } from 'next/navigation';

import {
    ClassDetailHero,
    ClassDetailSkeleton,
    getDifficultyLabel,
    useProgramReviews,
    usePartnerProgramDetail,
    useUpdateProgramStatus,
} from '@/entities/program';
import { useCurrentStudioId } from '@/entities/studio';
import { ApiError } from '@/shared/api';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useSheet, useToast } from '@/shared/model';

import { ClassDescription } from './ClassDescription';
import { ClassEditSheet } from './ClassEditSheet';
import { ClassExperienceInfo } from './ClassExperienceInfo';
import { ClassInfoTable } from './ClassInfoTable';

export function PartnerClassDetailClient() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const programId = params.id;
    const storeId = useCurrentStudioId();
    const { data, isLoading } = usePartnerProgramDetail(storeId, programId);
    const program = data?.program;
    const reviewsQuery = useProgramReviews(programId, { limit: 1 });
    const reviewCount = reviewsQuery.data?.totalCount ?? 0;
    const { open: openSheet, close: closeSheet } = useSheet();
    const { push: pushToast } = useToast();
    const statusMutation = useUpdateProgramStatus(storeId, programId);

    useHeaderOverride({ hideRightAction: true });

    if (isLoading || !program) {
        return <ClassDetailSkeleton />;
    }

    const isPublished = program.status === ProgramStatus.ACTIVE;
    // featureTags 는 운영 플래그에서 파생.
    const featureTags = [
        program.childFriendly && '어린이 가능',
        program.deliverable && '배송 가능',
    ].filter(Boolean) as string[];

    const handlePublish = () => {
        if (statusMutation.isPending) return;
        // INACTIVE/DRAFT → ACTIVE 게시.
        statusMutation.mutate(
            { status: ProgramStatus.ACTIVE },
            {
                onSuccess: () => pushToast({ message: '클래스를 게시했어요.' }),
                onError: (err) =>
                    pushToast({
                        message:
                            err instanceof ApiError ? err.message : '게시 중 오류가 발생했어요.',
                    }),
            },
        );
    };

    const handleCta = () => {
        if (!isPublished) {
            handlePublish();
            return;
        }
        openSheet(
            <ClassEditSheet
                programId={programId}
                storeId={storeId}
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
                    <ClassDetailHero
                        imageUrl={program.images[0]?.imageUrl}
                        alt={program.title}
                        priority
                    />
                </div>

                {/* 클래스 기본 정보 */}
                <section className="flex flex-col gap-3 py-2">
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-1">
                            <Tag className="!bg-primary-subtle !text-primary-darker">
                                {getDifficultyLabel(program.difficulty ?? ProgramDifficulty.BASIC)}
                            </Tag>
                            {featureTags.map((tag) => (
                                <Tag key={tag}>{tag}</Tag>
                            ))}
                        </div>
                        <h1 className="text-2xl font-extrabold leading-8 text-foreground">
                            {program.title}
                        </h1>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.push(`/partner/classes/${programId}/reviews`)}
                        className="flex w-fit cursor-pointer items-center text-sm font-semibold text-foreground"
                    >
                        클래스 리뷰 {reviewCount.toLocaleString('ko-KR')}개
                        <RightIcon size={16} />
                    </button>

                    <ClassDescription description={program.description} />
                </section>

                {/* 클래스 상세 정보 테이블 */}
                <section className="py-2">
                    <ClassInfoTable program={program} />
                </section>

                {/* 체험 정보 */}
                <section className="py-2">
                    <ClassExperienceInfo leadTimeDays={program.leadTimeDays} />
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
