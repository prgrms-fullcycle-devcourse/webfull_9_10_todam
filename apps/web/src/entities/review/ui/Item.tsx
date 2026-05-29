import Image from 'next/image';
import { Rating } from '@todam/ui';

export type ItemImage = {
    src: string;
    alt?: string;
};

export type ItemProps = {
    rating: number;
    ratingLabel?: string;
    userId: string;
    contents: string;
    images?: ItemImage[];
    tagLabel?: string;
    className?: string;
};

export function Item({
    rating,
    ratingLabel,
    userId,
    contents,
    images,
    tagLabel,
    className,
}: ItemProps) {
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
                            <div
                                key={index}
                                className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-muted"
                            >
                                <Image
                                    src={image.src}
                                    alt={image.alt ?? ''}
                                    fill
                                    sizes="128px"
                                    className="object-cover"
                                />
                            </div>
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
