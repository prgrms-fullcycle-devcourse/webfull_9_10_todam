'use client';

import { StoreStatus } from '@todam/shared';
import { usePathname } from 'next/navigation';

import { usePartnerStudioDetail } from '@/entities/studio';
import { useCurrentStudioId } from '@/entities/studio';

const SUPPORT_EMAIL = 'support.todam@gmail.com';

// 파트너가 선택한 공방이 게시 중단상태일 때 고객센터 문의 안내 노출
export function SuspendedStudioGate() {
    const pathname = usePathname();
    const isPartnerArea = pathname === '/partner' || pathname.startsWith('/partner/');

    const currentStudioId = useCurrentStudioId();
    // 파트너 영역에서만 조회(일반 유저 라우트에 잔존 storeId로 오작동 방지).
    const { data: detail } = usePartnerStudioDetail(isPartnerArea ? currentStudioId : '');

    if (!isPartnerArea) return null;
    if (detail?.store.status !== StoreStatus.SUSPENDED) return null;

    return (
        <div
            className="absolute inset-0 z-50 flex items-center justify-center bg-inverse/40 px-6"
            role="alertdialog"
            aria-modal
        >
            <div className="flex w-full flex-col items-center gap-2 rounded-2xl bg-surface p-6 text-center">
                <p className="text-base font-semibold text-foreground">이용이 중단되었습니다.</p>
                <p className="text-sm text-foreground-secondary">고객센터로 문의해주세요.</p>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm font-medium text-primary">
                    {SUPPORT_EMAIL}
                </a>
            </div>
        </div>
    );
}
