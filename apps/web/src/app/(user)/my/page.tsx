'use client';

import { Modal } from '@todam/ui';
import { PartnerStatus } from '@todam/shared';

import { useLogout } from '@/features/auth/logout';
import { TERMS, type TermsKey } from '@/features/auth/terms';
import { MyPageHub } from '@/features/user/profile';
import { usePartnerOnboarding } from '@/features/studio/registration';
import { useModal } from '@/shared/model';

const CUSTOMER_SUPPORT_TERMS: { key: TermsKey; label: string }[] = [
    { key: 'service', label: '서비스 이용약관' },
    { key: 'privacy', label: '개인정보처리방침' },
    { key: 'location', label: '위치기반 서비스 이용약관' },
];

export default function MyPage() {
    const { open: openModal, close: closeModal } = useModal();
    const { data: onboardingData } = usePartnerOnboarding();
    const isPartner = onboardingData?.partnerStatus === PartnerStatus.APPROVED;
    const runLogout = useLogout();

    const handleOpenTerms = (key: string) => {
        const item = TERMS.find((term) => term.key === key);
        if (item) window.open(item.notionUrl, '_blank', 'noopener,noreferrer');
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
                description="언제든 다시 돌아와 작품 기록을 이어갈 수 있어요."
                cancelLabel="취소"
                confirmLabel="로그아웃"
                onCancel={closeModal}
                onConfirm={doLogout}
            />,
        );
    };

    return (
        <MyPageHub
            isPartner={isPartner}
            customerSupportTerms={CUSTOMER_SUPPORT_TERMS}
            onOpenTerms={handleOpenTerms}
            onLogout={handleLogout}
        />
    );
}
