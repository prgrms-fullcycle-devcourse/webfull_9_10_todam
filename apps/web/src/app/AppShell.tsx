'use client';

import { PartnerStatus } from '@todam/shared';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { StoreRegistrationComplete, usePartnerOnboarding } from '@/features/store/registration';
import { BottomNav } from '@/widgets/bottom-navigation';
import { Header } from '@/widgets/header';

/**
 * 루트 앱 셸 + 온보딩 게이트.
 * - 게이트 영역(/partner·/apply)에서만 GET /partner/onboarding 조회(고객 라우트는 미조회).
 * - 검수중(PENDING)/반려(REJECTED) → Header·BottomNav 없이 StoreRegistrationComplete 전체 takeover.
 * - 무파트너(null)가 /partner 진입 → /apply 로 리다이렉트(파트너센터 영역).
 * - 그 외 → Header + children + BottomNav 정상 chrome.
 * 게이트 키 = partnerStatus (storeStatus 아님).
 */
export function AppShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const isPartnerArea = pathname === '/partner' || pathname.startsWith('/partner/');
    const isApplyArea = pathname === '/apply' || pathname.startsWith('/apply/');
    const isGated = isPartnerArea || isApplyArea;

    const { data, isLoading, isError } = usePartnerOnboarding(isGated);

    const partnerStatus = data?.partnerStatus ?? null;
    const store = data?.store ?? null;

    const blocking =
        isGated &&
        !isError &&
        store !== null &&
        (partnerStatus === PartnerStatus.PENDING || partnerStatus === PartnerStatus.REJECTED);

    // 무파트너가 파트너센터(/partner/*) 진입 → 온보딩(/apply)으로 보냄.
    const shouldRedirect = isPartnerArea && !isLoading && !isError && partnerStatus === null;

    useEffect(() => {
        if (shouldRedirect) router.replace('/apply');
    }, [shouldRedirect, router]);

    // 게이트 영역 조회 전/리다이렉트 진행 중엔 chrome·내용 모두 숨겨 깜빡임 방지.
    if (isGated && isLoading) return null;
    if (shouldRedirect) return null;

    // 검수중/반려: chrome 없이 전체 takeover.
    if (blocking && store) {
        return (
            <StoreRegistrationComplete
                storeId={store.id}
                partnerStatus={partnerStatus}
                onClose={() => router.push('/')}
                onEditInfo={() => router.push('/apply')}
            />
        );
    }

    return (
        <>
            <Header />
            {children}
            <BottomNav />
        </>
    );
}
