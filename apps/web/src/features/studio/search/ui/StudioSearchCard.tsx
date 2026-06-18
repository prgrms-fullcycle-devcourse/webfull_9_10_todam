import Image from 'next/image';
import Link from 'next/link';

import { StarFillIcon } from '@todam/ui';
import { formatPrice, type StoreListItem } from '@todam/shared';

// 공방 카드 (검색·근처 공유).
// matchedClass 있으면 그것 렌더, 없으면 representativeClass 렌더 (plan decision #3).
// region 표기: 검색 카드='{sido} {sigungu} {dong}' / 근처 카드=`dong`만
// (근처 공방 plan contract — 근처 카드=dong, 검색 카드=전체 문자열).
export function StudioSearchCard({
    store,
    regionFormat = 'full',
}: {
    store: StoreListItem;
    regionFormat?: 'full' | 'dong';
}) {
    const {
        slug,
        name,
        region,
        imageUrl,
        rating,
        reviewCount,
        distance,
        representativeClass,
        matchedClass,
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

    // region 표기: 근처 카드는 dong만, 검색 카드는 시·구·동 풀표기 (각 필드 nullable)
    const regionLabel =
        regionFormat === 'dong'
            ? (region.dong ?? '')
            : [region.sido, region.sigungu, region.dong].filter(Boolean).join(' ');

    return (
        <Link
            href={`/studio/${encodeURIComponent(slug)}`}
            className="flex w-full items-center gap-3"
        >
            {/* 썸네일 */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                {imageUrl && (
                    <Image src={imageUrl} alt={name} fill sizes="80px" className="object-cover" />
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
                        {/* 리뷰 0건이면 rating=null → 0.0 노출 (#111 정합). */}
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
