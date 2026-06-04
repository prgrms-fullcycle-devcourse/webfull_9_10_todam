import type { HTMLAttributes, ReactNode } from 'react';

import { DownIcon, UpIcon } from '@todam/ui';

export type ClassOrderCardItemProps = {
    programName: ReactNode;
    price: ReactNode;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    disableUp?: boolean;
    disableDown?: boolean;
} & HTMLAttributes<HTMLDivElement>;

type MoveButtonProps = {
    label: string;
    icon: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
};

function MoveButton({ label, icon, onClick, disabled }: MoveButtonProps) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
            className="cursor-pointer inline-flex h-10 w-10 items-center justify-center transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-control text-foreground-inverse">
                {icon}
            </span>
        </button>
    );
}

// 클래스 순서 변경 화면 카드 — 순수 프레젠테이션(상태/드래그/연동 없음)
export function ClassOrderCardItem({
    programName,
    price,
    onMoveUp,
    onMoveDown,
    disableUp = false,
    disableDown = false,
    className,
    ...props
}: ClassOrderCardItemProps) {
    return (
        <div
            className={[
                'flex w-full items-center gap-2 rounded-2xl border border-border-subtle bg-surface p-4',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
            {...props}
        >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-base font-semibold leading-5 text-foreground">
                    {programName}
                </span>
                <span className="truncate text-base font-medium leading-5 text-foreground">
                    {price}
                </span>
            </div>
            <div className="flex shrink-0 items-center">
                <MoveButton
                    label="위로"
                    icon={<UpIcon size={12} />}
                    onClick={onMoveUp}
                    disabled={disableUp}
                />
                <MoveButton
                    label="아래로"
                    icon={<DownIcon size={12} />}
                    onClick={onMoveDown}
                    disabled={disableDown}
                />
            </div>
        </div>
    );
}
