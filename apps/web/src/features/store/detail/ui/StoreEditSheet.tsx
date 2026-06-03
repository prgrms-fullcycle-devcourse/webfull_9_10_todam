'use client';

import { cloneElement } from 'react';
import type { ReactElement } from 'react';
import { useRouter } from 'next/navigation';

import { CalendarIcon, EditIcon, InformationIcon, RightIcon, StandardBottomSheet } from '@todam/ui';

import { useSheet } from '@/shared/model';

// 수정 항목 선택 바텀시트. AppSheet(host)에 content로 주입되고, 셸은 디자인시스템 StandardBottomSheet 사용.
// 항목 선택 시 각 수정 화면으로 라우팅. 수정 화면 자체는 본 기능 Scope Out — 라우팅만 담당.
type EditSlot = {
    segment: 'info' | 'business' | 'reservation';
    icon: ReactElement<{ size?: number }>;
    title: string;
    description: string;
};

const EDIT_SLOTS: EditSlot[] = [
    {
        segment: 'info',
        icon: <EditIcon />,
        title: '공방 정보 수정',
        description: '이름, 주소, 소개글을 수정할 수 있어요',
    },
    {
        segment: 'business',
        icon: <InformationIcon />,
        title: '영업 정보 수정',
        description: '운영 시간과 휴무일을 변경할 수 있어요',
    },
    {
        segment: 'reservation',
        icon: <CalendarIcon />,
        title: '예약 정보 수정',
        description: '시간 간격, 최대 정원을 설정할 수 있어요',
    },
];

export type StoreEditSheetProps = {
    storeId: string;
    storeName: string;
    inProgressReservationCount: number;
};

export function StoreEditSheet({
    storeId,
    storeName,
    inProgressReservationCount,
}: StoreEditSheetProps) {
    const router = useRouter();
    const { close } = useSheet();

    return (
        <StandardBottomSheet
            title={storeName}
            subTitle={`현재 진행 중인 예약이 총 ${inProgressReservationCount.toLocaleString('ko-KR')}건 있어요`}
            actionLabel="닫기"
            onAction={close}
            actionVariant="ghost"
        >
            <div className="flex flex-col gap-2">
                {EDIT_SLOTS.map((slot) => (
                    <button
                        key={slot.segment}
                        type="button"
                        className="flex cursor-pointer w-full items-center gap-5 rounded-2xl border border-border-subtle bg-surface p-4 text-left hover:bg-muted"
                        onClick={() => {
                            close();
                            router.push(`/partner/stores/${storeId}/edit/${slot.segment}`);
                        }}
                    >
                        {/* 아이콘 박스 32x32 radius8: bg #F3E7C8 → secondary-subtle(gold-100), 아이콘 #6B4C07 → secondary-darker(gold-800) */}
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary-subtle text-secondary-darker">
                            {cloneElement(slot.icon, { size: 16 })}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="text-base font-medium leading-5 text-foreground">
                                {slot.title}
                            </span>
                            <span className="text-xs font-normal leading-4 text-foreground-tertiary">
                                {slot.description}
                            </span>
                        </span>
                        <RightIcon size={20} className="shrink-0 text-foreground-tertiary" />
                    </button>
                ))}
            </div>
        </StandardBottomSheet>
    );
}
