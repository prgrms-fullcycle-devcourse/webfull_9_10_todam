import Image from 'next/image';
import { Rating } from '@todam/ui';

export type CardImage = {
    src: string;
    alt?: string;
};

export type CardItemProps = {
    rating: number;
    contents?: string;
    image?: CardImage;
    emptyText?: string;
    className?: string;
};

// 리뷰 미리보기 카드(256×80 고정). 이미지·내용 유무로 full·emptyPhoto·emptyContents 분기.
// 본문은 2줄까지만(line-clamp) 노출. 카드 스펙은 여기에 고정 → 사용처는 데이터만 전달.
export function CardItem({
    rating,
    contents,
    image,
    emptyText = '작성한 내용이 없습니다.',
    className,
}: CardItemProps) {
    const hasContents = Boolean(contents && contents.trim());

    return (
        <div
            className={[
                'flex h-20 w-64 shrink-0 snap-start items-start gap-3 overflow-hidden rounded-2xl border border-border-subtle bg-surface p-3',
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
                        'line-clamp-2 text-xs leading-4',
                        hasContents ? 'text-foreground' : 'text-foreground-tertiary',
                    ].join(' ')}
                >
                    {hasContents ? contents : emptyText}
                </p>
            </div>
        </div>
    );
}
