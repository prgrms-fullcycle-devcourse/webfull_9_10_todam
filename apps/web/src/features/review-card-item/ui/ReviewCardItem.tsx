import Image from 'next/image';
import { Rating } from '@todam/ui';

export type ReviewCardImage = {
    src: string;
    alt?: string;
};

export type ReviewCardItemProps = {
    rating: number;
    contents?: string;
    image?: ReviewCardImage;
    emptyText?: string;
    className?: string;
};

export function ReviewCardItem({
    rating,
    contents,
    image,
    emptyText = '작성한 내용이 없습니다.',
    className,
}: ReviewCardItemProps) {
    const hasContents = Boolean(contents && contents.trim());

    return (
        <div
            className={[
                'flex w-full items-start gap-3 rounded-2xl border border-border-subtle bg-surface p-3',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            {image && (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image
                        src={image.src}
                        alt={image.alt ?? ''}
                        fill
                        sizes="56px"
                        className="object-cover"
                    />
                </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Rating scope={Math.round(rating)} />
                <p
                    className={[
                        'text-xs leading-4',
                        hasContents ? 'text-foreground' : 'text-foreground-tertiary',
                    ].join(' ')}
                >
                    {hasContents ? contents : emptyText}
                </p>
            </div>
        </div>
    );
}
