import React, { type ReactElement } from 'react';
import { Divider } from '@todam/ui';

export type ResultTableRow = {
    label: string;
    value: string;
    icon?: ReactElement;
};

export type ResultTableProps = {
    title: string;
    storeName?: string;
    location?: string;
    rows?: ResultTableRow[];
    /** Tailwind bg class. Default "bg-surface". */
    background?: string;
    className?: string;
};

const defaultRows: ResultTableRow[] = [{ label: 'td', value: 'td' }];

export function ResultTable({
    title,
    storeName,
    location,
    rows = defaultRows,
    background = 'bg-surface',
    className,
}: ResultTableProps) {
    const subText = [storeName, location].filter(Boolean).join('・');

    return (
        <div
            className={['flex flex-col rounded-2xl px-4 py-2 w-full', background, className]
                .filter(Boolean)
                .join(' ')}
        >
            <div className="flex flex-col gap-1 py-2">
                <span className="text-lg font-semibold text-foreground">{title}</span>
                {subText && <span className="text-xs text-foreground-tertiary">{subText}</span>}
            </div>

            <Divider />

            {rows.map((row, index) => (
                <div key={index} className="flex items-start gap-2 py-3">
                    <div className="flex items-center gap-1 text-sm text-foreground-tertiary">
                        {row.icon}
                        <span>{row.label}</span>
                    </div>
                    <span className="flex-1 text-right text-sm font-semibold text-foreground">
                        {row.value}
                    </span>
                </div>
            ))}
        </div>
    );
}
