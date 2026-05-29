import React from 'react';
import { RightIcon } from '@todam/ui';

export type MenuTableRow = {
    label: string;
    onClick?: () => void;
};

export type MenuTableProps = {
    rows?: MenuTableRow[];
    /** Tailwind bg class. Default "bg-surface". */
    background?: string;
    className?: string;
};

const defaultRows: MenuTableRow[] = [{ label: 'td' }];

export function MenuTable({
    rows = defaultRows,
    background = 'bg-surface',
    className,
}: MenuTableProps) {
    return (
        <div
            className={['flex flex-col rounded-2xl px-4 py-1 w-full', background, className]
                .filter(Boolean)
                .join(' ')}
        >
            {rows.map((row, index) => (
                <button
                    key={index}
                    type="button"
                    onClick={row.onClick}
                    className="flex items-center justify-between gap-3 py-3 border-b border-border-subtle last:border-b-0 text-left"
                >
                    <span className="flex-1 text-xs font-semibold text-foreground">
                        {row.label}
                    </span>
                    <RightIcon size={24} className="text-foreground-tertiary" />
                </button>
            ))}
        </div>
    );
}
