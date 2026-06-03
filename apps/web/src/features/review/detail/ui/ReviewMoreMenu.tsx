'use client';

import { useState } from 'react';

import { EditIcon, Menu, TrashIcon, type MenuItem } from '@todam/ui';

// 리뷰 더보기 드롭다운 — Figma 정본(`8507:23762`) 기준. 전역 `Menu` 사용.
// 항목: "수정하기"(D13 30일 가드 → disabled) / "삭제하기"(danger).
const EDIT_DEADLINE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ReviewMoreMenuProps = {
    createdAt: string;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
};

export function ReviewMoreMenu({ createdAt, onEdit, onDelete, onClose }: ReviewMoreMenuProps) {
    // D13: 작성 후 30일 초과 시 "수정하기" 비활성. mount 시점 기준으로 1회 계산.
    const [editDisabled] = useState(() => {
        const created = new Date(createdAt).getTime();
        return Number.isNaN(created) || created + EDIT_DEADLINE_DAYS * DAY_MS < Date.now();
    });

    const actions: Array<{ item: MenuItem; run: () => void }> = [
        { item: { label: '수정하기', icon: <EditIcon />, disabled: editDisabled }, run: onEdit },
        { item: { label: '삭제하기', icon: <TrashIcon />, danger: true }, run: onDelete },
    ];

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
