'use client';

import { useState } from 'react';

import { EditIcon, TrashIcon } from '@todam/ui';

// 리뷰 더보기 드롭다운 — Figma 정본(`8507:23762`) 기준.
// 항목: "수정하기"(D13 30일 가드) / "삭제하기"(danger).
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

    return (
        <div
            role="menu"
            className="flex w-50 flex-col rounded-xl bg-surface p-1 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
        >
            <p className="p-1 text-center text-xs text-foreground-tertiary">메뉴보기</p>

            <button
                type="button"
                role="menuitem"
                disabled={editDisabled}
                onClick={
                    editDisabled
                        ? undefined
                        : () => {
                              onEdit();
                              onClose();
                          }
                }
                className={[
                    'flex h-8 items-center justify-between gap-2 rounded-lg px-2 text-left text-sm',
                    editDisabled ? 'cursor-default text-border' : 'text-foreground hover:bg-muted',
                ].join(' ')}
            >
                <span>수정하기</span>
                <EditIcon size={20} className={editDisabled ? 'text-border' : 'text-foreground'} />
            </button>

            <button
                type="button"
                role="menuitem"
                onClick={() => {
                    onDelete();
                    onClose();
                }}
                className="flex h-8 items-center justify-between gap-2 rounded-lg px-2 text-left text-sm text-danger hover:bg-muted"
            >
                <span>삭제하기</span>
                <TrashIcon size={20} className="text-danger" />
            </button>
        </div>
    );
}
