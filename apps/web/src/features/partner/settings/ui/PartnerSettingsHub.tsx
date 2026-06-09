'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, SectionTitle, Toggle } from '@todam/ui';

import { logout } from '@/features/auth/logout';
import { TERMS } from '@/features/auth/terms';
import { useReviewStore } from '@/entities/store';
import { MenuTable } from '@/shared/ui';
import { useModal } from '@/shared/model';

// 고객지원 약관 — figma 라벨 기준. notionUrl은 TERMS(key)에서 조회.
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

    // 알림 토글은 영속 API 미연동(후속). 화면 표시용 로컬 상태만 유지.
    const [reservationNoti, setReservationNoti] = useState(true);
    const [marketingNoti, setMarketingNoti] = useState(false);

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
        const item = TERMS.find((term) => term.key === key);
        if (item) window.open(item.notionUrl, '_blank', 'noopener,noreferrer');
    };

    const doLogout = async () => {
        closeModal();
        try {
            await logout();
        } catch (err) {
            console.warn('[logout] 서버 로그아웃 실패, 클라이언트 토큰만 제거', err);
        } finally {
            window.localStorage.removeItem('accessToken');
            router.push('/login');
        }
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

            {/* 알림 설정 섹션 (UI only) */}
            <section className="flex flex-col gap-1 py-2">
                <SectionTitle size="md" title="알림 설정" />
                <div className="flex w-full flex-col rounded-2xl bg-surface px-4 py-1">
                    {/* 새 예약 알림 */}
                    <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-foreground">
                                새 예약 알림
                            </span>
                            <span className="text-xs text-foreground-tertiary">
                                새로운 예약이 들어오면 알려드려요
                            </span>
                        </div>
                        <Toggle
                            checked={reservationNoti}
                            onCheckedChange={setReservationNoti}
                            aria-label="새 예약 알림"
                        />
                    </div>
                    {/* 혜택 및 이벤트 소식 */}
                    <div className="flex items-center justify-between gap-3 py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-foreground">
                                혜택 및 이벤트 소식
                            </span>
                            <span className="text-xs text-foreground-tertiary">
                                새로운 공방과 이벤트를 알려드려요
                            </span>
                        </div>
                        <Toggle
                            checked={marketingNoti}
                            onCheckedChange={setMarketingNoti}
                            aria-label="혜택 및 이벤트 소식"
                        />
                    </div>
                </div>
            </section>

            {/* 고객지원 섹션 */}
            <section className="flex flex-col gap-1 py-2">
                <SectionTitle size="md" title="고객지원" />
                <MenuTable rows={customerSupportRows} />
            </section>

            {/* Footer — LEADEM v1.0.0 한 줄 */}
            <footer className="mt-auto flex items-center justify-center gap-1 py-5">
                <span className="text-xs leading-4 text-foreground-tertiary">LEADEM</span>
                <span className="text-xs font-semibold leading-4 text-foreground-tertiary">
                    v1.0.0
                </span>
            </footer>
        </main>
    );
}
