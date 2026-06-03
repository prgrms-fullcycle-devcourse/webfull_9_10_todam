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
 * - 반려 후 정보수정 라우트(/partner/stores/{id}/business·edit)는 차단 예외 → 재제출 진입 가능.
 * - 그 외 → Header + children + BottomNav 정상 chrome.
 * 게이트 키 = partnerStatus (storeStatus 아님).
 */
export function AppShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const isPartnerArea = pathname === '/partner' || pathname.startsWith('/partner/');
    const isApplyArea = pathname === '/apply' || pathname.startsWith('/apply/');
    const isGated = isPartnerArea || isApplyArea;

    // 반려 후 재제출용 편집 라우트는 게이트 예외(차단 시 정보수정 진입 불가 루프).
    // /partner/stores/{id}/business, /partner/stores/{id}/edit/*
    const isStoreEditRoute = /^\/partner\/stores\/[^/]+\/(business|edit)(\/|$)/.test(pathname);

    const { data, isLoading, isError } = usePartnerOnboarding(isGated);

    const partnerStatus = data?.partnerStatus ?? null;
    const store = data?.store ?? null;

    const blocking =
        isGated &&
        !isStoreEditRoute &&
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
                onEditInfo={() => router.push(`/partner/stores/${store.id}/business`)}
            />
        );
    }

    return (
        <>
            <Header />
            {/* Header·BottomNav 사이 잔여 높이만 차지. 페이지의 h-full/flex-1 이 이 박스 기준으로 해석됨. */}
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            <BottomNav />
        </>
    );
}
