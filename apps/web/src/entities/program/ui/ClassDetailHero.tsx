import Image from 'next/image';

// 클래스 상세 대표 이미지. user/partner 공용. rounded-2xl h-44 카드 + next/Image fill.
// 이미지 없으면(미업로드/실패) 기본 OG 이미지 폴백.
export function ClassDetailHero({
    imageUrl,
    alt,
    priority = false,
}: {
    imageUrl: string | null | undefined;
    alt: string;
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
        </div>
    );
}
