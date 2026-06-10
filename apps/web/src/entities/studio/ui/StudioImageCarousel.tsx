'use client';

import { useRef, useState } from 'react';

import { Pagination } from '@todam/ui';
import type { StoreImage } from '@todam/shared';

// 대표 이미지 carousel. 가로 스크롤(터치 native) + 마우스 드래그 + 인디케이터.
// UI-2(디자인 토큰) 미확정 → 기존 패턴(plain img + bg-muted + object-cover)·기본 스케일로 골격 구성.
export function StudioImageCarousel({ images }: { images: StoreImage[] }) {
    const [active, setActive] = useState(0);
    const trackRef = useRef<HTMLDivElement>(null);
    // 마우스 드래그 상태. 터치는 native 스크롤·스냅에 위임하므로 mouse 포인터만 처리.
    const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

    const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

    if (sorted.length === 0) {
        return (
            <div className="grid aspect-[3/2] w-full place-items-center bg-muted text-sm text-foreground-tertiary">
                등록된 이미지가 없습니다.
            </div>
        );
    }

    function scrollToIndex(index: number) {
        const el = trackRef.current;
        if (!el) return;
        el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
    }

    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
        if (e.pointerType !== 'mouse') return; // 터치/펜은 native 스크롤
        const el = trackRef.current;
        if (!el) return;
        drag.current = {
            active: true,
            startX: e.clientX,
            startScroll: el.scrollLeft,
            moved: false,
        };
        el.setPointerCapture(e.pointerId);
    }

    function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (!drag.current.active) return;
        const el = trackRef.current;
        if (!el) return;
        const dx = e.clientX - drag.current.startX;
        if (Math.abs(dx) > 3) drag.current.moved = true;
        el.scrollLeft = drag.current.startScroll - dx;
    }

    function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
        if (!drag.current.active) return;
        const el = trackRef.current;
        drag.current.active = false;
        if (el) {
            try {
                el.releasePointerCapture(e.pointerId);
            } catch {
                /* 캡처 없는 pointerId 면 InvalidPointerId throw — 무시 */
            }
            // 수동 scrollLeft 변경은 CSS snap 을 트리거하지 않으므로 가까운 인덱스로 직접 스냅.
            const index = Math.round(el.scrollLeft / el.clientWidth);
            scrollToIndex(index);
            setActive(index);
        }
    }

    return (
        <div className="relative">
            <div
                ref={trackRef}
                className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto"
                onScroll={(e) => {
                    const el = e.currentTarget;
                    const index = Math.round(el.scrollLeft / el.clientWidth);
                    setActive(index);
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                {sorted.map((image) => (
                    <img
                        key={image.id}
                        src={image.imageUrl}
                        alt=""
                        draggable={false}
                        // 마우스 드래그 중 이미지로 클릭 이벤트·텍스트 선택 전파 방지.
                        onClickCapture={(e) => {
                            if (drag.current.moved) e.preventDefault();
                        }}
                        className="aspect-[3/2] w-full shrink-0 cursor-grab snap-center select-none bg-muted object-cover active:cursor-grabbing"
                    />
                ))}
            </div>
            {sorted.length > 1 && (
                <Pagination
                    count={sorted.length}
                    activeIndex={active}
                    onDotClick={scrollToIndex}
                    className="absolute bottom-10 left-0 right-0 justify-center"
                />
            )}
        </div>
    );
}
