'use client';

import { useEffect, useRef, useState } from 'react';

import { Button, CloseIcon, EditIcon, Menu, MoreIcon, type MenuItem } from '@todam/ui';
import type { ReservationDetail } from '@todam/shared';

// 예약 상세 헤더 우측 더보기 버튼 + 메뉴보기 드롭다운 (self-contained, StoreListHeaderMenu 패턴).
// 항목: "수정하기" / "예약 취소하기"(canCancel 시, danger).
export type MoreMenuProps = {
    reservation: ReservationDetail;
    onCancel: () => void;
    onEdit: () => void;
};

export function MoreMenu({ reservation, onCancel, onEdit }: MoreMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onPointerDown(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [open]);

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
        <div ref={ref} className="relative">
            <Button
                variant="ghost"
                layout="onlyIcon"
                size="lg"
                icon={<MoreIcon />}
                aria-label="더보기"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="hover:!bg-transparent hover:!text-foreground"
            />
            {open && (
                <div className="absolute right-5 top-10 z-50 w-50">
                    <Menu
                        title="메뉴보기"
                        items={actions.map((a) => a.item)}
                        onItemSelect={(index) => {
                            setOpen(false);
                            actions[index]?.run();
                        }}
                    />
                </div>
            )}
        </div>
    );
}
