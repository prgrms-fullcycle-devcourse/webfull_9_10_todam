'use client';

import { useEffect, useRef, useState } from 'react';

import { Button, EditIcon, Menu, MoreIcon, TrashIcon, type MenuItem } from '@todam/ui';

// 리뷰 상세 헤더 우측 더보기 버튼 + 메뉴보기 드롭다운 (self-contained, StoreListHeaderMenu 패턴).
// 항목: "수정하기"(D13 30일 가드 → disabled) / "삭제하기"(danger). Figma 정본 `8507:23762`.
const EDIT_DEADLINE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ReviewMoreMenuProps = {
    createdAt: string;
    onEdit: () => void;
    onDelete: () => void;
};

export function ReviewMoreMenu({ createdAt, onEdit, onDelete }: ReviewMoreMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // D13: 작성 후 30일 초과 시 "수정하기" 비활성. mount 시점 기준으로 1회 계산.
    const [editDisabled] = useState(() => {
        const created = new Date(createdAt).getTime();
        return Number.isNaN(created) || created + EDIT_DEADLINE_DAYS * DAY_MS < Date.now();
    });

    useEffect(() => {
        if (!open) return;
        function onPointerDown(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [open]);

    const actions: Array<{ item: MenuItem; run: () => void }> = [
        { item: { label: '수정하기', icon: <EditIcon />, disabled: editDisabled }, run: onEdit },
        { item: { label: '삭제하기', icon: <TrashIcon />, danger: true }, run: onDelete },
    ];

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
