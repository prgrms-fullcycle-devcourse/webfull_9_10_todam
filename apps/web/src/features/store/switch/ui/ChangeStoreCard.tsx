import { StoreStatus } from '@todam/shared';
import { Tag } from '@todam/ui';

const STATUS_TAG: Record<StoreStatus, { label: string; className: string }> = {
    [StoreStatus.PUBLISHED]: {
        label: '노출 중',
        className: 'bg-success !text-foreground-inverse w-fit',
    },
    [StoreStatus.SUSPENDED]: {
        label: '게시 중단',
        className: 'bg-danger !text-foreground-inverse w-fit',
    },
    [StoreStatus.PENDING]: {
        label: '심사 중',
        className: 'bg-muted !text-foreground-secondary w-fit',
    },
    [StoreStatus.DRAFT]: {
        label: '작성 중',
        className: 'bg-muted !text-foreground-secondary w-fit',
    },
    [StoreStatus.REJECTED]: {
        label: '반려',
        className: 'bg-danger !text-foreground-inverse w-fit',
    },
};

export interface ChangeStoreCardProps {
    storeName: string;
    status: StoreStatus;
    showSwitch?: boolean;
    onSwitch?: () => void;
}

export function ChangeStoreCard({
    storeName,
    status,
    showSwitch = false,
    onSwitch,
}: ChangeStoreCardProps) {
    const tag = STATUS_TAG[status];

    return (
        <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface p-4">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Tag className={tag.className}>{tag.label}</Tag>
                <span className="truncate text-base font-semibold text-foreground">
                    {storeName}
                </span>
            </div>

            {showSwitch && (
                <button
                    type="button"
                    onClick={onSwitch}
                    className="shrink-0 cursor-pointer rounded-xl bg-muted px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:opacity-90"
                >
                    전환
                </button>
            )}
        </div>
    );
}
