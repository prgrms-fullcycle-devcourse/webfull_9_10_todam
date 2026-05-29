import { Rating } from '@todam/ui';

export type ReviewImage = {
    src: string;
    alt?: string;
};

export type ReviewItemProps = {
    rating: number;
    ratingLabel?: string;
    userId: string;
    contents: string;
    images?: ReviewImage[];
    tagLabel?: string;
    className?: string;
};

export function ReviewItem({
    rating,
    ratingLabel,
    userId,
    contents,
    images,
    tagLabel,
    className,
}: ReviewItemProps) {
    return (
        <div className={['flex w-full flex-col gap-4', className].filter(Boolean).join(' ')}>
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <Rating scope={Math.round(rating)} />
                    <span className="text-sm font-semibold text-foreground-secondary">
                        {ratingLabel ?? rating}
                    </span>
                </div>
                <span className="text-[10px] text-foreground-tertiary">{userId}</span>
            </div>
            <div className="flex flex-col gap-3">
                <p className="text-xs leading-4 text-foreground">{contents}</p>
                {images && images.length > 0 && (
                    <div className="flex gap-2">
                        {images.map((image, index) => (
                            <img
                                key={index}
                                src={image.src}
                                alt={image.alt ?? ''}
                                className="h-32 w-32 shrink-0 rounded-2xl bg-muted object-cover"
                            />
                        ))}
                    </div>
                )}
                {tagLabel && (
                    <span className="inline-flex h-7 w-fit items-center rounded-lg border border-border px-3 text-xs text-foreground-secondary">
                        {tagLabel}
                    </span>
                )}
            </div>
        </div>
    );
}
