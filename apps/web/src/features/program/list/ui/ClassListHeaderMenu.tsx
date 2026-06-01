'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button, Menu, MoreIcon, PlusIcon, SwapIcon } from '@todam/ui';

type ClassListHeaderMenuProps = {
    // 순서 변경 메뉴 활성 조건: 등록 클래스 2개 이상.
    programCount: number;
};

// 클래스 관리 헤더 우측 더보기 버튼 + 메뉴보기 드롭다운.
// 항목: [클래스 등록], [클래스 순서 변경](1개 이하 disabled).
// 순서 변경 PATCH 호출은 미확정 블로커 → 화면 이동까지만 구현(plan Decision #2).
export function ClassListHeaderMenu({ programCount }: ClassListHeaderMenuProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const reorderDisabled = programCount <= 1;

    useEffect(() => {
        if (!open) return;
        function onPointerDown(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <Button
                variant="ghost"
                layout="onlyIcon"
                size="lg"
                icon={<MoreIcon />}
                aria-label="더보기"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="hover:!bg-transparent hover:!text-foreground"
            />
            {open && (
                <div className="absolute right-5 top-10 z-50 w-44">
                    <Menu
                        title="메뉴보기"
                        items={[
                            { label: '클래스 등록', icon: <PlusIcon /> },
                            {
                                label: '클래스 순서 변경',
                                icon: <SwapIcon />,
                                disabled: reorderDisabled,
                            },
                        ]}
                        onItemSelect={(index) => {
                            if (index === 0) {
                                setOpen(false);
                                router.push('/partner/classes/new');
                                return;
                            }
                            if (index === 1) {
                                if (reorderDisabled) return;
                                setOpen(false);
                                router.push('/partner/classes/reorder');
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
}
