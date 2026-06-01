'use client';

import { CloseIcon, EditIcon } from '@todam/ui';
import type { ReservationDetail } from '@todam/shared';

// 디자인 정본 — Figma `a6a2d988...` Menu(more 클릭 시 floating).
// 항목:
//   - "수정하기" (체험 전 / canCancel 시) — placeholder
//   - "예약 취소하기" (canCancel === true 시, text color danger)
// 체험 완료 후엔 메뉴 항목 없음 — 호출 측에서 hidden 처리.
export type MoreMenuProps = {
    reservation: ReservationDetail;
    onCancel: () => void;
    onEdit: () => void;
    onClose: () => void;
};

export function MoreMenu({ reservation, onCancel, onEdit, onClose }: MoreMenuProps) {
    return (
        <div
            role="menu"
            className="flex w-50 flex-col rounded-xl bg-surface p-1 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
        >
            <p className="p-1 text-center text-xs text-foreground-tertiary">메뉴보기</p>

            <button
                type="button"
                role="menuitem"
                onClick={() => {
                    onEdit();
                    onClose();
                }}
                className="flex h-8 items-center justify-between gap-2 rounded-lg px-2 text-left text-sm text-foreground hover:bg-muted"
            >
                <span>수정하기</span>
                <EditIcon size={20} className="text-foreground-tertiary" />
            </button>

            {reservation.canCancel && (
                <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                        onCancel();
                        onClose();
                    }}
                    className="flex h-8 items-center justify-between gap-2 rounded-lg px-2 text-left text-sm text-danger hover:bg-muted"
                >
                    <span>예약 취소하기</span>
                    <CloseIcon size={20} className="text-danger" />
                </button>
            )}
        </div>
    );
}
