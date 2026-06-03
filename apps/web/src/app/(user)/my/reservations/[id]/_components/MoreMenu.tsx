'use client';

import { CloseIcon, EditIcon, Menu, type MenuItem } from '@todam/ui';
import type { ReservationDetail } from '@todam/shared';

// 디자인 정본 — Figma `a6a2d988...` Menu(more 클릭 시 floating). 전역 `Menu` 사용.
// 항목:
//   - "수정하기" (체험 전 / canCancel 시) — placeholder
//   - "예약 취소하기" (canCancel === true 시, danger)
// 체험 완료 후엔 메뉴 항목 없음 — 호출 측에서 hidden 처리.
export type MoreMenuProps = {
    reservation: ReservationDetail;
    onCancel: () => void;
    onEdit: () => void;
    onClose: () => void;
};

export function MoreMenu({ reservation, onCancel, onEdit, onClose }: MoreMenuProps) {
    const actions: Array<{ item: MenuItem; run: () => void }> = [
        {
            item: { label: '수정하기', icon: <EditIcon className="text-foreground-tertiary" /> },
            run: onEdit,
        },
    ];
    if (reservation.canCancel) {
        actions.push({
            item: { label: '예약 취소하기', icon: <CloseIcon />, danger: true },
            run: onCancel,
        });
    }

    return (
        <Menu
            className="w-50"
            title="메뉴보기"
            items={actions.map((a) => a.item)}
            onItemSelect={(index) => {
                actions[index]?.run();
                onClose();
            }}
        />
    );
}
