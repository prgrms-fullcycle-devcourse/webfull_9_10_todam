import type { ReactNode } from 'react';

import { StarFillIcon } from '@todam/ui';

export type StudioInfoSummaryProps = {
    name: string;
    rating: number;
    reviewCount: number;
    description: string;
    // 평점 행 우측에 붙는 액션 슬롯(문의하기/공유하기 등). 동작은 상위(feature/page)에서 주입.
    actions?: ReactNode;
    // 공방명 우측 배지 슬롯(상태 배지 등). 파트너/고객 뷰 차이를 슬롯으로 흡수.
    badge?: ReactNode;
    // 공방명 위에 노출되는 태그 슬롯(편의 정보 태그 등). 비면 미노출.
    tags?: ReactNode;
};

// 공방 기본 정보 표현 컴포넌트(공방명/평점/리뷰수/소개). 순수 표현 — 데이터페치·라우팅 없음.
// 파트너 뷰와 고객 뷰가 공유한다. 뷰별 차이는 tags/badge/actions 슬롯으로 받는다.
export function StudioInfoSummary({
    name,
    rating,
    reviewCount,
    description,
    actions,
    badge,
    tags,
}: StudioInfoSummaryProps) {
    return (
        <section className="flex flex-col gap-2">
            {tags}
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold leading-8 text-foreground">{name}</h1>
                {badge}
            </div>
            <div className="flex items-center gap-1 text-sm font-normal leading-[18px]">
                {/* 단일 별(green) + 평점/리뷰수. 디자인: star 12px + "4.9"(secondary) + "(248)"(tertiary) */}
                <StarFillIcon size={12} className="text-primary-lighter" />
                <span className="text-foreground-secondary">{rating.toFixed(1)}</span>
                <span className="text-foreground-tertiary">
                    ({reviewCount.toLocaleString('ko-KR')})
                </span>
                {actions}
            </div>
            <p className="whitespace-pre-wrap text-sm font-normal leading-[18px] text-foreground">
                {description}
            </p>
        </section>
    );
}
