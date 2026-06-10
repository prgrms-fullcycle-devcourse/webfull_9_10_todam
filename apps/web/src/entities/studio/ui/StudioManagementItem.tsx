import type { HTMLAttributes, ReactNode } from 'react';

export type StudioManagementItemProps = {
    storeName: ReactNode;
    ownerName: ReactNode;
    badge?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export function StudioManagementItem({
    storeName,
    ownerName,
    badge,
    className,
    ...props
}: StudioManagementItemProps) {
    return (
        <div
            className={[
                'flex w-full items-center gap-3 rounded-2xl border border-border-subtle bg-surface p-4',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
            {...props}
        >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="truncate text-base font-semibold leading-5 text-foreground">
                    {storeName}
                </span>
                <span className="flex items-center gap-1 text-xs font-normal leading-4">
                    <span className="text-foreground-tertiary">대표자</span>
                    <span className="truncate text-foreground-secondary">{ownerName}</span>
                </span>
            </div>
            {badge && <span className="shrink-0">{badge}</span>}
        </div>
    );
}
