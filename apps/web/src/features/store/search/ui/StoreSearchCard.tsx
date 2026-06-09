import Image from 'next/image';
import Link from 'next/link';

import { StarFillIcon } from '@todam/ui';
import { formatPrice, type StoreListItem } from '@todam/shared';

// 검색 결과 공방 카드.
// matchedClass 있으면 그것 렌더, 없으면 representativeClass 렌더 (plan decision #3).
// region subtitle = "{sido} {sigungu} {dong}" (plan decision #1).
export function StoreSearchCard({ store }: { store: StoreListItem }) {
    const {
        slug,
        name,
        region,
        thumbnailUrl,
        rating,
        reviewCount,
        distance,
        representativeClass,
        matchedClass,
        isOperating,
    } = store;

    // 카드에 표시할 클래스 정보 결정
    const displayClass = matchedClass ?? representativeClass;
    const showHasMore = !matchedClass && representativeClass?.hasMore === true;

    // 거리 표기: 1000m 이상이면 km, 미만이면 m. 위치 미제공 시 distance=null → 표기 생략
    const distanceLabel =
        distance == null
            ? null
            : distance >= 1000
              ? `${(distance / 1000).toFixed(1)}km`
              : `${distance}m`;

    // 평점: 신규/리뷰 없음(rating=null)은 0.0으로 노출
    const ratingLabel = (rating ?? 0).toFixed(1);

    // region 풀표기 (각 필드 nullable)
    const regionLabel = [region.sido, region.sigungu, region.dong].filter(Boolean).join(' ');

    return (
        <Link
            href={`/stores/${encodeURIComponent(slug)}`}
            className="flex w-full items-center gap-3"
        >
            {/* 썸네일 (준비 중이면 딤 오버레이 + 라벨) */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                {thumbnailUrl && (
                    <Image
                        src={thumbnailUrl}
                        alt={name}
                        fill
                        sizes="80px"
                        className="object-cover"
                    />
                )}
                {!isOperating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-foreground/60">
                        <span className="text-sm text-surface">준비 중</span>
                    </div>
                )}
            </div>

            {/* 본문 */}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                {/* 공방명 + 평점 (한 줄) */}
                <div className="flex items-center gap-2">
                    <p className="truncate text-base font-semibold leading-5 text-foreground">
                        {name}
                    </p>
                    <span className="flex shrink-0 items-center gap-1 text-sm text-foreground-secondary">
                        <StarFillIcon size={12} className="text-foreground-secondary" />
                        <span>{ratingLabel}</span>
                        <span className="text-foreground-tertiary">({reviewCount})</span>
                    </span>
                </div>

                {/* 지역・거리 (한 줄, 중점 구분) */}
                <p className="truncate text-xs text-foreground-tertiary">
                    {[regionLabel, distanceLabel].filter(Boolean).join('・')}
                </p>

                {/* 클래스 정보 — matchedClass는 정확가(`45,000원`), representativeClass 다건은 `~`(최저가부터). plan decision #3 */}
                {displayClass && (
                    <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-foreground-secondary">
                            {displayClass.name}
                        </p>
                        <p className="shrink-0 text-sm font-semibold text-foreground">
                            {formatPrice(displayClass.price)}
                            {showHasMore ? '~' : ''}
                        </p>
                    </div>
                )}
            </div>
        </Link>
    );
}
