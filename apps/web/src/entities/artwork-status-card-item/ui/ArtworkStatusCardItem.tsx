import { Badge, RightIcon } from '@todam/ui';
import type { ReactElement } from 'react';

export type ArtworkStatusCardItemProps = {
    status: string;
    statusIcon?: ReactElement<{ size?: number }>;
    statusMessage: string;
    progress: number;
    remainingText: string;
    onDetailClick?: () => void;
    className?: string;
};

export function ArtworkStatusCardItem({
    status,
    statusIcon,
    statusMessage,
    progress,
    remainingText,
    onDetailClick,
    className,
}: ArtworkStatusCardItemProps) {
    const clampedProgress = Math.min(100, Math.max(0, progress));

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
                <Badge icon={statusIcon}>{status}</Badge>
                <p className="text-base font-semibold leading-5 text-foreground">{statusMessage}</p>
            </div>
            <div className="flex flex-col gap-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full rounded-full bg-info"
                        style={{ width: `${clampedProgress}%` }}
                    />
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-foreground-tertiary">{remainingText}</span>
                    <button
                        type="button"
                        onClick={onDetailClick}
                        className="flex shrink-0 items-center text-xs text-foreground-secondary"
                    >
                        자세히보기
                        <RightIcon size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
