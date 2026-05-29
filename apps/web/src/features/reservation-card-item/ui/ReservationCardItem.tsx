import { ClockIcon } from '@todam/ui';

export type ReservationCardItemProps = {
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

export function ReservationCardItem({
    date,
    day,
    status,
    lessonName,
    category,
    storeName,
    time,
    statusMessage,
    className,
}: ReservationCardItemProps) {
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
                    <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-primary-subtle px-2 text-primary-darker">
                        <ClockIcon size={12} />
                        <span className="text-[10px] font-medium leading-[15px]">{status}</span>
                    </span>
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
