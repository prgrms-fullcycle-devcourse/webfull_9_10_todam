'use client';

import { useState } from 'react';

import { Pagination } from '@todam/ui';
import type { StoreImage } from '@todam/shared';

// 대표 이미지 carousel. 가로 스크롤 + 인디케이터. 순수 표현 컴포넌트(props만 받음).
// UI-2(디자인 토큰) 미확정 → 기존 패턴(plain img + bg-muted + object-cover)·기본 스케일로 골격 구성.
export function StoreImageCarousel({ images }: { images: StoreImage[] }) {
    const [active, setActive] = useState(0);

    const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

    if (sorted.length === 0) {
        return (
            <div className="grid aspect-[3/2] w-full place-items-center bg-muted text-sm text-foreground-tertiary">
                등록된 이미지가 없습니다.
            </div>
        );
    }

    return (
        <div className="relative">
            <div
                className="flex snap-x snap-mandatory overflow-x-auto"
                onScroll={(e) => {
                    const el = e.currentTarget;
                    const index = Math.round(el.scrollLeft / el.clientWidth);
                    setActive(index);
                }}
            >
                {sorted.map((image) => (
                    <img
                        key={image.id}
                        src={image.imageUrl}
                        alt=""
                        className="aspect-[3/2] w-full shrink-0 snap-center bg-muted object-cover"
                    />
                ))}
            </div>
            {sorted.length > 1 && (
                <Pagination
                    count={sorted.length}
                    activeIndex={active}
                    className="absolute bottom-3 left-0 right-0 justify-center"
                />
            )}
        </div>
    );
}
