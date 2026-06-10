import type { ReactNode } from 'react';

import { StarFillIcon } from '@todam/ui';

export type StudioInfoSummaryProps = {
    name: string;
    rating: number;
    reviewCount: number;
    description: string;
    actions?: ReactNode;
    tags?: ReactNode;
};

export function StudioInfoSummary({
    name,
    rating,
    reviewCount,
    description,
    actions,
    tags,
}: StudioInfoSummaryProps) {
    return (
        <>
            <section className="flex flex-col gap-2 py-2">
                {tags}
                <h1 className="text-2xl font-extrabold text-foreground">{name}</h1>
                <div className="flex items-center gap-1 text-sm font-normal">
                    <StarFillIcon size={12} className="text-primary-lighter" />
                    <span className="text-foreground-secondary">{rating.toFixed(1)}</span>
                    <span className="text-foreground-tertiary">
                        ({reviewCount.toLocaleString('ko-KR')})
                    </span>
                    {actions}
                </div>
            </section>
            <p className="whitespace-pre-wrap text-sm font-normal text-foreground">{description}</p>
        </>
    );
}
