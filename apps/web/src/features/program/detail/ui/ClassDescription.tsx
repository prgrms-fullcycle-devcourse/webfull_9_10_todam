'use client';

import { useEffect, useRef, useState } from 'react';

import { DownIcon, UpIcon } from '@todam/ui';

// 클래스 상세 설명.
// - 설명 없음: 회색 안내 문구.
// - 3줄 초과: line-clamp-3 + 더보기/접기 토글(text-xs).
export function ClassDescription({ description }: { description: string | null }) {
    const ref = useRef<HTMLParagraphElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [overflow, setOverflow] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        // 접힌(line-clamp-3) 기준 실제 높이가 더 크면 3줄 초과 → 토글 노출.
        setOverflow(el.scrollHeight > el.clientHeight + 1);
    }, [description]);

    if (!description) {
        return (
            <p className="py-2 text-sm leading-[18px] text-foreground-tertiary">
                클래스 안내를 준비 중이에요.
            </p>
        );
    }

    return (
        <div className="py-2">
            <p
                ref={ref}
                className={[
                    'whitespace-pre-wrap text-sm leading-[18px] text-foreground',
                    expanded ? '' : 'line-clamp-3',
                ].join(' ')}
            >
                {description}
            </p>
            {(overflow || expanded) && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setExpanded((v) => !v)}
                        className="mt-1 flex cursor-pointer items-center gap-0.5 text-xs font-medium text-foreground-tertiary"
                    >
                        {expanded ? '접기' : '더보기'}
                        {expanded ? <UpIcon size={12} /> : <DownIcon size={12} />}
                    </button>
                </div>
            )}
        </div>
    );
}
