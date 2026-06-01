'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button, Menu, MoreIcon, PlusIcon } from '@todam/ui';

// 공방 관리 헤더 우측 더보기 버튼 + 메뉴보기 드롭다운.
export function StoreListHeaderMenu() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

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
                <div className="absolute right-5 top-10 z-50 w-40">
                    <Menu
                        title="메뉴보기"
                        items={[{ label: '공방 등록', icon: <PlusIcon /> }]}
                        onItemSelect={() => {
                            setOpen(false);
                            router.push('/partner/stores/new');
                        }}
                    />
                </div>
            )}
        </div>
    );
}
