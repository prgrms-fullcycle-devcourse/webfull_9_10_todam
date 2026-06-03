'use client';

import { useRouter } from 'next/navigation';

import { EditIcon, InformationIcon, PauseIcon, RightIcon, StandardBottomSheet } from '@todam/ui';
import type { ReactElement } from 'react';

import { useToast } from '@/shared/model';

type Props = {
    programId: string;
    title: string;
    reservationCount: number;
    onClose: () => void;
};

type Action = {
    key: string;
    icon: ReactElement<{ size?: number }>;
    label: string;
    description: string;
    onClick: () => void;
};

const ICON_SIZE = 16;

// 클래스 수정 액션 바텀시트 (게시 ACTIVE 상태에서 노출). 액션·라우팅을 자체 보유.
export function ClassEditSheet({ programId, title, reservationCount, onClose }: Props) {
    const router = useRouter();
    const { push: pushToast } = useToast();

    const actions: Action[] = [
        {
            key: 'info',
            icon: <EditIcon size={ICON_SIZE} />,
            label: '기본 정보 수정',
            description: '기존 예약에도 즉시 반영돼요',
            onClick: () => {
                onClose();
                router.push(`/partner/classes/${programId}/edit/info`);
            },
        },
        {
            key: 'operations',
            icon: <InformationIcon size={ICON_SIZE} />,
            label: '운영 정보 수정',
            description: '신규 예약부터 반영돼요',
            onClick: () => {
                onClose();
                router.push(`/partner/classes/${programId}/edit/operations`);
            },
        },
        {
            key: 'pause',
            icon: <PauseIcon size={ICON_SIZE} />,
            label: '게시 중단',
            description: '신규 예약을 더 이상 받지 않아요',
            onClick: () => {
                onClose();
                // TODO(연동 후행): 게시 중단 PATCH(status=INACTIVE).
                pushToast({ message: '게시 중단 기능은 준비 중이에요.' });
            },
        },
    ];

    return (
        <StandardBottomSheet
            title={title}
            subTitle={`현재 진행 중인 예약이 ${reservationCount}건 있어요`}
            actionLabel="닫기"
            actionVariant="ghost"
            onAction={onClose}
        >
            <div className="flex flex-col gap-2">
                {actions.map((action) => (
                    <button
                        key={action.key}
                        type="button"
                        onClick={action.onClick}
                        className="flex cursor-pointer items-center gap-5 rounded-2xl border border-border-subtle p-4 text-left transition-colors hover:bg-muted"
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
