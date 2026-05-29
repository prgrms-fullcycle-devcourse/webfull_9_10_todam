import { Button, HeartFillIcon } from '@todam/ui';

export type LikedStoreItemProps = {
    storeName: string;
    address: string;
    imageSrc?: string;
    imageAlt?: string;
    onToggleLike?: () => void;
    className?: string;
};

export function LikedStoreItem({
    storeName,
    address,
    imageSrc,
    imageAlt,
    onToggleLike,
    className,
}: LikedStoreItemProps) {
    return (
        <div className={['flex w-full items-center gap-3', className].filter(Boolean).join(' ')}>
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                {imageSrc && (
                    <img
                        src={imageSrc}
                        alt={imageAlt ?? storeName}
                        className="h-full w-full object-cover"
                    />
                )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="truncate text-base font-semibold leading-5 text-foreground">
                    {storeName}
                </p>
                <p className="truncate text-xs text-foreground-tertiary">{address}</p>
            </div>
            <Button
                variant="overlay"
                layout="onlyIcon"
                size="sm"
                icon={<HeartFillIcon />}
                aria-label="찜 해제"
                onClick={onToggleLike}
                className="shrink-0"
            />
        </div>
    );
}
