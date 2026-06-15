'use client';

import { useRouter } from 'next/navigation';
import { Modal, SectionTitle, Toggle } from '@todam/ui';

import { useLogout } from '@/features/auth/logout';
import { useLatestPolicies } from '@/features/auth/terms';
import type { TermsKey } from '@/features/auth/terms';
import { useEnablePush } from '@/features/notification';
import {
    useNotificationSettings,
    usePatchNotificationSettings,
} from '@/features/user/notification-settings';
import { useReviewStore } from '@/entities/studio';
import { MenuTable } from '@/shared/ui';
import { useModal, useToast } from '@/shared/model';

// 고객지원 약관 — figma 라벨 기준. URL은 GET /policies/latest API 응답(urlMap)에서 조회.
const CUSTOMER_SUPPORT_TERMS = [
    { key: 'service', label: '서비스 이용약관' },
    { key: 'privacy', label: '개인정보처리방침' },
    { key: 'location', label: '위치기반서비스 이용약관' },
] as const;

// 파트너 설정 메인. 내 정보 / 알림 설정(UI only) / 고객지원 + footer.
export function PartnerSettingsHub() {
    const router = useRouter();
    const { setReviewStoreId } = useReviewStore();
    const { open: openModal, close: closeModal } = useModal();
    const runLogout = useLogout();
    const { urlMap } = useLatestPolicies();

    // webPush는 계정 단위 채널 스위치 — 고객 마이페이지와 같은 notificationSettings 공유.
    const { data: notifData } = useNotificationSettings();
    const patchNotif = usePatchNotificationSettings();
    const enablePush = useEnablePush();
    const { push: toast } = useToast();
    const webPushEnabled = notifData?.notificationSettings.webPushEnabled ?? false;

    const handleWebPushToggle = async (value: boolean) => {
        if (!value) {
            patchNotif.mutate({ webPushEnabled: false });
            return;
        }
        const result = await enablePush();
        if (!result.ok) {
            const message =
                result.reason === 'denied'
                    ? '브라우저 알림 권한이 거부됐어요. 브라우저 설정에서 허용해 주세요.'
                    : result.reason === 'unsupported'
                      ? '이 브라우저는 웹 푸시를 지원하지 않아요.'
                      : '알림을 켜지 못했어요. 잠시 후 다시 시도해 주세요.';
            toast({ message });
            return;
        }
        patchNotif.mutate({ webPushEnabled: true });
    };

    // 공방 관리 = 현재 작업 공방 상세. review 보기 상태 해제 후 진입.
    const goStore = () => {
        setReviewStoreId(null);
        router.push('/partner/studio');
    };

    const myInfoRows = [
        { label: '개인 정보 수정', onClick: () => router.push('/partner/settings/profile') },
        { label: '공방 관리', onClick: goStore },
        { label: '사업자 정보', onClick: () => router.push('/partner/settings/business') },
        { label: '수강생 모드로 전환하기', onClick: () => router.push('/') },
    ];

    const handleOpenTerms = (key: string) => {
        const url = urlMap[key as TermsKey];
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
    };

    const doLogout = async () => {
        closeModal();
        await runLogout();
    };

    const handleLogout = () => {
        openModal(
            <Modal
                type="shortText"
                title="로그아웃 하시겠어요?"
                description="언제든 다시 돌아와 공방 운영을 이어갈 수 있어요."
                cancelLabel="취소"
                confirmLabel="로그아웃"
                onCancel={closeModal}
                onConfirm={doLogout}
            />,
        );
    };

    const customerSupportRows = [
        ...CUSTOMER_SUPPORT_TERMS.map((term) => ({
            label: term.label,
            onClick: () => handleOpenTerms(term.key),
        })),
        // 로그아웃 — chevron 없음, 보조 색.
        { label: '로그아웃', onClick: handleLogout, showChevron: false, muted: true },
    ];

    return (
        <main className="flex flex-1 flex-col overflow-y-auto px-4 pb-16">
            {/* 내 정보 섹션 */}
            <section className="flex flex-col gap-1 py-2">
                <SectionTitle size="md" title="내 정보" />
                <MenuTable rows={myInfoRows} />
            </section>

            {/* 알림 설정 섹션 */}
            <section className="flex flex-col gap-1 py-2">
                <SectionTitle size="md" title="알림 설정" />
                <div className="flex w-full flex-col rounded-2xl bg-surface px-4 py-1">
                    {/* 푸시 알림 — 계정 단위 채널 스위치. ON 시 권한+토큰 등록. 카테고리·수신자는 서버 처리 */}
                    <div className="flex items-center justify-between gap-3 py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-foreground">푸시 알림</span>
                            <span className="text-xs text-foreground-tertiary">
                                기기로 알림을 받아요
                            </span>
                        </div>
                        <Toggle
                            checked={webPushEnabled}
                            onCheckedChange={(v) => void handleWebPushToggle(v)}
                            disabled={patchNotif.isPending}
                            aria-label="푸시 알림"
                        />
                    </div>
                </div>
            </section>

            {/* 고객지원 섹션 */}
            <section className="flex flex-col gap-1 py-2">
                <SectionTitle size="md" title="고객지원" />
                <MenuTable rows={customerSupportRows} />
            </section>

            {/* Footer — TODAM v1.0.0 한 줄 */}
            <footer className="mt-auto flex items-center justify-center gap-1 py-5">
                <span className="text-xs leading-4 text-foreground-tertiary">TODAM</span>
                <span className="text-xs font-semibold leading-4 text-foreground-tertiary">
                    v1.0.0
                </span>
            </footer>
        </main>
    );
}
