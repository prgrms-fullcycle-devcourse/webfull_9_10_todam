'use client';

import { PartnerStatus, StoreStatus } from '@todam/shared';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useCurrentStore } from '@/entities/store';
import {
    useCurrentStoreQuery,
    useUpdateCurrentStoreMutation,
} from '@/features/store/current-store';
import { StoreRegistrationComplete, usePartnerOnboarding } from '@/features/store/registration';
import { BottomNav } from '@/widgets/bottom-navigation';
import { Header } from '@/widgets/header';

export function AppShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const isPartnerArea = pathname === '/partner' || pathname.startsWith('/partner/');
    const isApplyArea = pathname === '/apply' || pathname.startsWith('/apply/');
    const isGated = isPartnerArea || isApplyArea;

    // 반려 후 재제출용 편집 라우트는 게이트 예외(차단 시 정보수정 진입 불가 루프).
    // /partner/studio/{id}/business(반려 재제출 — 미승인이라 [id] 명시), /partner/studio/edit/*(정보수정)
    const isStoreEditRoute = /^\/partner\/studio\/([^/]+\/business|edit)(\/|$)/.test(pathname);

    const { data, isLoading, isError } = usePartnerOnboarding(isGated);

    const partnerStatus = data?.partnerStatus ?? null;
    const store = data?.store ?? null;

    const blocking =
        isGated &&
        !isStoreEditRoute &&
        !isError &&
        store !== null &&
        (partnerStatus === PartnerStatus.PENDING || partnerStatus === PartnerStatus.REJECTED);

    // 일반 유저가 파트너센터(/partner/*) 진입 → 온보딩(/apply)으로 리디렉션
    const shouldRedirect = isPartnerArea && !isLoading && !isError && partnerStatus === null;

    useEffect(() => {
        if (shouldRedirect) router.replace('/apply');
    }, [shouldRedirect, router]);

    // APPROVED 파트너 진입 시 currentStore bootstrap
    const isApproved = partnerStatus === PartnerStatus.APPROVED;
    const bootstrapEnabled = isPartnerArea && isApproved && !isLoading && !isError;

    const { storeId, setStoreId } = useCurrentStore();
    const needsBootstrap = bootstrapEnabled && storeId === null;

    const { data: currentStoreData, isLoading: isCurrentStoreLoading } =
        useCurrentStoreQuery(needsBootstrap);
    const { mutate: updateCurrentStoreMutation } = useUpdateCurrentStoreMutation();

    useEffect(() => {
        if (!currentStoreData) return;

        const { lastAccessedStoreId, stores } = currentStoreData;

        // lastAccessedStoreId 있으면 전역 storeId 주입
        if (lastAccessedStoreId) {
            setStoreId(lastAccessedStoreId);
            return;
        }

        // lastAccessedStoreId 미설정 예외 처리
        const fallback = stores.find((s) => s.status === StoreStatus.PUBLISHED) ?? stores[0];
        if (!fallback) return;
        setStoreId(fallback.id);
        updateCurrentStoreMutation(fallback.id);
    }, [currentStoreData, setStoreId, updateCurrentStoreMutation]);

    // 게이트 영역 조회 전/리다이렉트 진행 중엔 chrome·내용 모두 숨겨 깜빡임 방지.
    if (isGated && isLoading) return null;
    if (shouldRedirect) return null;

    // currentStore bootstrap 조회 중엔 내용 숨겨 깜빡임 방지.
    if (needsBootstrap && isCurrentStoreLoading) return null;

    // 검수중/반려 파트너 (게이트 키 = partnerStatus)
    if (blocking && store) {
        return (
            <StoreRegistrationComplete
                storeId={store.id}
                onClose={() => router.push('/')}
                onEditInfo={() => router.push(`/partner/studio/${store.id}/business`)}
            />
        );
    }

    return (
        <>
            <Header />
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            <BottomNav />
        </>
    );
}
