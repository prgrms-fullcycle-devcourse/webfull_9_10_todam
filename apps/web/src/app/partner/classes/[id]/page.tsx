'use client';

import { useEffect } from 'react';

import type { ReactElement } from 'react';

import {
    Button,
    StandardBottomSheet,
    Tag,
    CalendarIcon,
    ClockIcon,
    EditIcon,
    FlagIcon,
    InformationIcon,
    NametagIcon,
    PauseIcon,
    RightIcon,
    UserIcon,
} from '@todam/ui';
import { ProgramDeliveryOption, ProgramDifficulty, ProgramStatus } from '@todam/shared';

import { InfoTable, type InfoTableRow } from '../../../../shared/ui';
import { useHeaderActionStore, useSheet } from '../../../../shared/model';
import { getDeliveryLabel, getDifficultyLabel, formatDuration } from '../../../../entities/program';

type ProgramDetail = {
    title: string;
    description: string | null;
    price: number;
    durationMinutes: number;
    capacity: number;
    leadTimeDays: number;
    deliveryOption: ProgramDeliveryOption;
    difficulty: ProgramDifficulty;
    status: ProgramStatus;
    reviewCount: number;
    featureTags: string[];
    images: Array<{ imageUrl: string }>;
};

// API 연동 전 디자인 확인용 목 데이터. 실 연동 시 GET /partner/stores/{storeId}/programs/{programId}로 교체.
const mockProgram: ProgramDetail = {
    title: '머그컵 만들기',
    description: '물레 없이 손으로 빚는 머그컵 클래스는 초보자도 즐기면서 참여할 수 있습니다.',
    price: 45000,
    durationMinutes: 120,
    capacity: 4,
    leadTimeDays: 28,
    deliveryOption: ProgramDeliveryOption.CUSTOMER_SELECT,
    difficulty: ProgramDifficulty.BASIC,
    status: ProgramStatus.ACTIVE,
    reviewCount: 0,
    featureTags: ['어린이 가능', '배송 가능'],
    images: [],
};

const ICON_SIZE = 16;

type EditAction = {
    key: string;
    icon: ReactElement<{ size?: number }>;
    label: string;
    description: string;
    onClick: () => void;
};

// 클래스 수정 액션 바텀시트 (게시 상태 ACTIVE에서 노출).
function ClassEditSheet({
    title,
    reservationCount,
    actions,
    onClose,
}: {
    title: string;
    reservationCount: number;
    actions: EditAction[];
    onClose: () => void;
}) {
    return (
        <StandardBottomSheet
            title={title}
            subTitle={`현재 진행 중인 예약이 ${reservationCount}건 있어요`}
            actionLabel="닫기"
            actionVariant="outline"
            onAction={onClose}
        >
            <div className="flex flex-col gap-2">
                {actions.map((action) => (
                    <button
                        key={action.key}
                        type="button"
                        onClick={action.onClick}
                        className="flex items-center gap-5 rounded-2xl border border-border-subtle p-4 text-left transition-colors hover:bg-muted"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-subtle text-secondary-darker">
                            {action.icon}
                        </span>
                        <span className="flex flex-1 flex-col gap-1">
                            <span className="text-base font-medium leading-5 text-foreground">
                                {action.label}
                            </span>
                            <span className="text-xs font-normal leading-4 text-foreground-tertiary">
                                {action.description}
                            </span>
                        </span>
                        <RightIcon size={24} className="shrink-0 text-foreground-tertiary" />
                    </button>
                ))}
            </div>
        </StandardBottomSheet>
    );
}

export default function PartnerClassDetailPage() {
    const program = mockProgram;
    const isPublished = program.status === ProgramStatus.ACTIVE;
    const { open: openSheet, close: closeSheet } = useSheet();

    // sub 헤더 기본 우측 알림 아이콘 숨김 (빈 action 주입으로 noti fallback 대체).
    const setAction = useHeaderActionStore((s) => s.setAction);
    const clearAction = useHeaderActionStore((s) => s.clearAction);
    useEffect(() => {
        setAction(<span aria-hidden />);
        return () => clearAction();
    }, [setAction, clearAction]);

    const editActions: EditAction[] = [
        {
            key: 'info',
            icon: <EditIcon size={16} />,
            label: '기본 정보 수정',
            description: '기존 예약에도 즉시 반영돼요',
            onClick: () => {},
        },
        {
            key: 'operations',
            icon: <InformationIcon size={16} />,
            label: '운영 정보 수정',
            description: '신규 예약부터 반영돼요',
            onClick: () => {},
        },
        {
            key: 'pause',
            icon: <PauseIcon size={16} />,
            label: '게시 중단',
            description: '신규 예약을 더 이상 받지 않아요',
            onClick: () => {},
        },
    ];

    const handleCta = () => {
        if (!isPublished) return;
        openSheet(
            <ClassEditSheet
                title={program.title}
                reservationCount={12}
                actions={editActions}
                onClose={closeSheet}
            />,
        );
    };

    const rows: InfoTableRow[] = [
        {
            label: '가격',
            value: `${program.price.toLocaleString()}원`,
            icon: <NametagIcon size={ICON_SIZE} />,
        },
        {
            label: '소요 시간',
            value: formatDuration(program.durationMinutes),
            icon: <ClockIcon size={ICON_SIZE} />,
        },
        {
            label: '정원',
            value: `최대 ${program.capacity}명`,
            icon: <UserIcon size={ICON_SIZE} />,
        },
        {
            label: '평균 제작일',
            value: `${program.leadTimeDays}일`,
            icon: <CalendarIcon size={ICON_SIZE} />,
        },
        {
            label: '작품 수령 방법',
            value: getDeliveryLabel(program.deliveryOption),
            icon: <FlagIcon size={ICON_SIZE} />,
        },
    ];

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
                                {getDifficultyLabel(program.difficulty)}
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
                        클래스 리뷰 {program.reviewCount}개
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
                    <InfoTable rows={rows} />
                </section>
            </main>

            {/* 하단 고정 CTA */}
            <div className="shrink-0 border-t border-border-subtle bg-surface px-4 pb-7 pt-4">
                <Button variant="filled" size="lg" className="w-full" onClick={handleCta}>
                    {isPublished ? '클래스 정보 수정하기' : '클래스 게시하기'}
                </Button>
            </div>
        </>
    );
}
