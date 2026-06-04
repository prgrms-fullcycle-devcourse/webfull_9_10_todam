'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { ProgramRegistrationFlow } from '@/features/program/registration';
import { useToast } from '@/shared/model';

export default function PartnerClassNewPage() {
    const router = useRouter();
    const { push } = useToast();
    const storeId = useSearchParams().get('storeId') ?? '';
    // StrictMode(dev) effect 2회 실행 → 토스트 중복 방지용 1회 가드.
    const guarded = useRef(false);

    // storeId 없으면 등록 불가(POST 경로 storeId 누락) → 공방 선택 화면으로 되돌림 + 안내.
    useEffect(() => {
        if (!storeId && !guarded.current) {
            guarded.current = true;
            push({ message: '공방을 선택해주세요' });
            router.replace('/partner/classes');
        }
    }, [storeId, push, router]);

    if (!storeId) return null;

    const returnTo = `/partner/classes?storeId=${storeId}`;
    return <ProgramRegistrationFlow storeId={storeId} returnTo={returnTo} />;
}
