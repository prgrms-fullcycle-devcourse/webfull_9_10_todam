import { Badge, ClockIcon } from '@todam/ui';

export type CardItemProps = {
    date: string;
    day: string;
    status: string;
    lessonName: string;
    category: string;
    storeName: string;
    time: string;
    statusMessage: string;
    className?: string;
};

export function CardItem({
    date,
    day,
    status,
    lessonName,
    category,
    storeName,
    time,
    statusMessage,
    className,
}: CardItemProps) {
    return (
        <div
            className={[
                'flex w-full flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-4',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center gap-1">
                        <span className="text-base font-semibold text-foreground">{date}</span>
                        <span className="text-base text-foreground-tertiary">{day}</span>
                    </div>
                    <Badge tone="primary" icon={<ClockIcon />} className="shrink-0">
                        {status}
                    </Badge>
                </div>
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">{lessonName}</p>
                    <p className="text-xs text-foreground-tertiary">
                        {category}・{storeName}・{time}
                    </p>
                </div>
            </div>
            <div className="flex h-8 items-center rounded-lg bg-muted px-3">
                <p className="text-xs font-semibold text-foreground-secondary">{statusMessage}</p>
            </div>
        </div>
    );
}
