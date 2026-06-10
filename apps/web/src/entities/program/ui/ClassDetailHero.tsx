import Image from 'next/image';
import type { ReactNode } from 'react';

// 클래스 상세 대표 이미지. user/partner 공용. rounded-2xl h-44 카드 + next/Image fill.
// 이미지 없으면(미업로드/실패) 기본 OG 이미지 폴백. overlay: 우상단 액션 슬롯(공유 등).
export function ClassDetailHero({
    imageUrl,
    alt,
    overlay,
    priority = false,
}: {
    imageUrl: string | null | undefined;
    alt: string;
    overlay?: ReactNode;
    priority?: boolean;
}) {
    return (
        <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-muted">
            <Image
                src={imageUrl || '/OG-image.png'}
                alt={alt}
                fill
                sizes="(max-width: 430px) 100vw, 430px"
                priority={priority}
                className="object-cover"
            />
            {overlay && <div className="absolute right-3 top-3 z-10">{overlay}</div>}
        </div>
    );
}
