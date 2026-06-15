'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Modal, SectionTitle, TextInput } from '@todam/ui';
import { PartnerTerminationErrorCode } from '@todam/shared';

import { ApiError } from '@/shared/api';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useModal, useSheet, useToast } from '@/shared/model';
import { useMyProfile } from '@/features/user/profile';
import { ResetRequestSheet } from '@/features/auth/reset-password';
import { useAuthStore } from '@/features/auth/login/model/authStore';
import { useTerminatePartner } from '@/features/partner/termination';

// 설정 - 개인 정보 수정. 계정 정보(읽기 전용 이메일) + 비밀번호 재설정 + 파트너 해지 진입.
export function PartnerProfileScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const toast = useToast();
    const { open: openSheet } = useSheet();
    const { open: openModal, close: closeModal } = useModal();
    const clearAuth = useAuthStore((s) => s.clearAuth);

    // sub 헤더 기본 우측 noti 숨김.
    useHeaderOverride({ hideRightAction: true });

    const { data: profileData, isLoading } = useMyProfile();
    const email = profileData?.user.email ?? '';

    const terminate = useTerminatePartner();

    const doTerminate = () => {
        terminate.mutate(undefined, {
            onSuccess: () => {
                closeModal();
                // 해지 성공 → 인증/캐시 초기화 후 비인증 메인으로.
                clearAuth();
                queryClient.clear();
                toast.push({ message: '파트너 자격이 해지되었어요.' });
                router.replace('/');
            },
            onError: (err) => {
                closeModal();
                if (
                    err instanceof ApiError &&
                    err.code === PartnerTerminationErrorCode.ACTIVE_RESERVATIONS_OR_ARTWORKS_EXIST
                ) {
                    toast.push({
                        message: '진행 중인 예약이나 제작 중인 작품이 있어 해지할 수 없어요.',
                    });
                    return;
                }
                toast.push({
                    message: '해지 처리 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
                });
            },
        });
    };

    const handleTerminate = () => {
        openModal(
            <Modal
                type="shortText"
                title="파트너 자격을 해지하시겠어요?"
                description="해지하면 등록하신 클래스와 소중한 수강생 리뷰가 모두 삭제되며 복구할 수 없어요."
                cancelLabel="다음에 하기"
                confirmLabel="자격 해지하기"
                danger
                onCancel={closeModal}
                onConfirm={doTerminate}
            />,
        );
    };

    return (
        <main className="flex flex-1 flex-col overflow-y-auto px-4 pb-16">
            <section className="flex flex-col gap-4 py-2">
                <SectionTitle size="md" title="계정 정보" />

                {/* 계정(이메일) — 읽기 전용 */}
                <TextInput
                    id="partner-account-email"
                    label="계정"
                    type="email"
                    value={isLoading ? '' : email}
                    readOnly
                    disabled
                    placeholder="로딩 중..."
                />

                {/* 비밀번호 재설정 — 재설정 요청 시트 */}
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => openSheet(<ResetRequestSheet initialEmail={email} />)}
                        className="text-xs font-semibold text-primary"
                    >
                        비밀번호 재설정
                    </button>
                </div>
            </section>

            {/* 파트너 해지 진입 */}
            <div className="flex items-center justify-center gap-1 py-5">
                <span className="text-xs text-foreground-tertiary">
                    혹시 공방 운영을 중단하고 싶으신가요?
                </span>
                <button
                    type="button"
                    onClick={handleTerminate}
                    disabled={terminate.isPending}
                    className="text-xs font-semibold text-foreground-tertiary underline disabled:opacity-60"
                >
                    파트너 해지하기
                </button>
            </div>
        </main>
    );
}
