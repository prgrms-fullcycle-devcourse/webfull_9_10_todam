import { StoreStatus } from '@todam/shared';
import { RightIcon, StandardBottomSheet } from '@todam/ui';

// 게시상태 → 슬롯 서브텍스트 라벨.
const STATUS_LABEL: Record<StoreStatus, string> = {
    [StoreStatus.PUBLISHED]: '게시 중',
    [StoreStatus.PENDING]: '심사 중',
    [StoreStatus.SUSPENDED]: '게시 중단',
    [StoreStatus.REJECTED]: '반려',
    [StoreStatus.DRAFT]: '작성 중',
};

export interface StudioSwitchSheetStore {
    id: string;
    name: string;
    status: StoreStatus;
    /** TODO: 오늘 예약 건수 — per-store 집계 API 연동 후 채움(현재 미제공 시 라벨만). */
    todayReservationCount?: number;
}

export interface StudioSwitchSheetProps {
    stores: StudioSwitchSheetStore[];
    onSelect: (store: StudioSwitchSheetStore) => void;
    onRegister: () => void;
    onClose: () => void;
}

function SlotRow({
    title,
    subText,
    onClick,
}: {
    title: string;
    subText?: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full cursor-pointer items-center gap-5 rounded-2xl border border-border-subtle bg-surface p-4 text-left transition-colors hover:bg-muted"
        >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-base font-medium text-foreground">{title}</span>
                {subText && <span className="text-xs text-foreground-tertiary">{subText}</span>}
            </span>
            <RightIcon size={24} className="shrink-0 text-foreground-tertiary" />
        </button>
    );
}

export function StudioSwitchSheet({
    stores,
    onSelect,
    onRegister,
    onClose,
}: StudioSwitchSheetProps) {
    return (
        <StandardBottomSheet
            title="공방을 전환하시겠어요?"
            subTitle="공방별 예약과 작품 진행현황을 확인할 수 있어요."
            actionLabel="닫기"
            actionVariant="ghost"
            onAction={onClose}
        >
            <div className="flex flex-col gap-2">
                {stores.map((store) => {
                    const statusLabel = STATUS_LABEL[store.status];
                    // 서브텍스트 = "상태 ・ 오늘 예약 N건" (건수 미제공 시 상태만).
                    const subText =
                        typeof store.todayReservationCount === 'number'
                            ? `${statusLabel} ・ 오늘 예약 ${store.todayReservationCount}건`
                            : statusLabel;
                    return (
                        <SlotRow
                            key={store.id}
                            title={store.name}
                            subText={subText}
                            onClick={() => onSelect(store)}
                        />
                    );
                })}
                <SlotRow title="새 공방 등록하기" onClick={onRegister} />
            </div>
        </StandardBottomSheet>
    );
}
