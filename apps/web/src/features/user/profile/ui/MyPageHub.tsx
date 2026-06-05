'use client';

import { useRouter } from 'next/navigation';
import { Toggle } from '@todam/ui';
import { PartnerStatus } from '@todam/shared';

import { MenuTable } from '@/shared/ui';
import { useSheet } from '@/shared/model';
import { TERMS_CONTENT } from '@/features/auth/terms/model/termsContent';
import type { TermsKey } from '@/features/auth/terms/model/termsContent';
import { usePartnerOnboarding } from '@/features/store/registration';
import {
    useNotificationSettings,
    usePatchNotificationSettings,
} from '../../notification-settings/queries';
import { TermsViewSheet } from './TermsViewSheet';

// 고객지원 약관 3종 정의 (Figma "마이" 8505:19320 — 서비스이용약관/개인정보처리방침/위치기반서비스)
const CUSTOMER_SUPPORT_TERMS: { key: TermsKey; label: string }[] = [
    { key: 'service', label: '서비스 이용약관' },
    { key: 'privacy', label: '개인정보처리방침' },
    { key: 'location', label: '위치기반 서비스 이용약관' },
];

export function MyPageHub() {
    const router = useRouter();
    const { open: openSheet } = useSheet();

    const { data: onboardingData } = usePartnerOnboarding();
    const { data: notifData } = useNotificationSettings();
    const patchNotif = usePatchNotificationSettings();

    // 파트너 여부 출처 = GET /partner/onboarding 의 partnerStatus (실 BE에 GET /users/me 미존재).
    // APPROVED 만 파트너 센터 진입, 그 외(null/PENDING/REJECTED)는 공방 등록 진입.
    const isPartner = onboardingData?.partnerStatus === PartnerStatus.APPROVED;
    const artworkEnabled = notifData?.notificationSettings.artworkEnabled ?? true;
    const marketingEnabled = notifData?.notificationSettings.marketingEnabled ?? false;

    const handleToggle = (field: 'artworkEnabled' | 'marketingEnabled', value: boolean) => {
        patchNotif.mutate({ [field]: value });
    };

    const handleOpenTerms = (key: TermsKey) => {
        const doc = TERMS_CONTENT[key];
        openSheet(<TermsViewSheet title={doc.title} sections={doc.sections} />);
    };

    const handleLogout = () => {
        // 로그아웃: localStorage 토큰 제거 후 로그인 페이지로 이동
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem('accessToken');
        }
        router.push('/login');
    };

    // 내 정보 섹션 메뉴 rows — 라벨만 isPartner로 분기(D6/D8). 목적지는 /partner 단일,
    // 비/미승인 파트너 redirect는 AppShell 온보딩 게이트가 처리(리뷰 #190 반영).
    const myInfoRows = [
        { label: '개인 정보 수정', onClick: () => router.push('/my/profile') },
        { label: '찜한 공방 목록', onClick: () => router.push('/my/favorites') },
        {
            label: isPartner ? '파트너 센터 이동하기' : '공방 등록하기',
            onClick: () => router.push('/partner'),
        },
    ];

    return (
        <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 bg-background">
            {/* 내 정보 섹션 */}
            <section className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold text-foreground">내 정보</h2>
                <MenuTable rows={myInfoRows} />
            </section>

            {/* 알림 설정 섹션 */}
            <section className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold text-foreground">알림 설정</h2>
                <div className="flex flex-col rounded-2xl bg-surface px-4 py-1 w-full">
                    {/* 내 작품 소식 토글 */}
                    <div className="flex items-center justify-between gap-3 py-3 border-b border-border-subtle">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-foreground">
                                내 작품 소식
                            </span>
                            <span className="text-xs text-foreground-tertiary">
                                제작 단계가 바뀌면 알려드려요
                            </span>
                        </div>
                        <Toggle
                            checked={artworkEnabled}
                            onCheckedChange={(v) => handleToggle('artworkEnabled', v)}
                            disabled={patchNotif.isPending}
                            aria-label="내 작품 소식 알림"
                        />
                    </div>
                    {/* 혜택 및 이벤트 소식 토글 */}
                    <div className="flex items-center justify-between gap-3 py-3">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-foreground">
                                혜택 및 이벤트 소식
                            </span>
                            <span className="text-xs text-foreground-tertiary">
                                새로운 공방과 이벤트를 알려드려요
                            </span>
                        </div>
                        <Toggle
                            checked={marketingEnabled}
                            onCheckedChange={(v) => handleToggle('marketingEnabled', v)}
                            disabled={patchNotif.isPending}
                            aria-label="혜택 및 이벤트 소식 알림"
                        />
                    </div>
                </div>
            </section>

            {/* 고객지원 섹션 */}
            <section className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold text-foreground">고객지원</h2>
                <div className="flex flex-col rounded-2xl bg-surface px-4 py-1 w-full">
                    {CUSTOMER_SUPPORT_TERMS.map((term) => (
                        <button
                            key={term.key}
                            type="button"
                            onClick={() => handleOpenTerms(term.key)}
                            className="flex items-center justify-between gap-3 py-3 border-b border-border-subtle last:border-b-0 text-left"
                        >
                            <span className="flex-1 text-xs font-semibold text-foreground">
                                {term.label}
                            </span>
                            <span className="text-foreground-tertiary text-base">›</span>
                        </button>
                    ))}
                    {/* 로그아웃 — chevron 없음, 텍스트 foreground-tertiary */}
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center py-3 text-left"
                    >
                        <span className="text-xs font-semibold text-foreground-tertiary">
                            로그아웃
                        </span>
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-auto flex flex-col items-center gap-1 pt-4 pb-2">
                <div className="h-px w-full bg-border-subtle mb-4" />
                <span className="text-sm font-semibold text-foreground-tertiary">LEADEM</span>
                <span className="text-xs text-foreground-tertiary">v1.0.0</span>
            </footer>
        </main>
    );
}
