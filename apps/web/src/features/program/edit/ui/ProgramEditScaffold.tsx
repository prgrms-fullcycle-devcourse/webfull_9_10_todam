'use client';

import { BottomBar, Button, Modal } from '@todam/ui';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { useModal } from '../../../../shared/model/modal';
import { useHeaderOverride } from '../../../../shared/lib/useHeaderOverride';

type Props = {
    title: string;
    isDirty: boolean;
    isSaving: boolean;
    onSave: () => void;
    children: ReactNode;
};

// 클래스 수정 화면 공통 셸: 전역 Header(타이틀+이탈 가드 뒤로가기) override + 스크롤 폼 영역 + 하단 저장 버튼.
// 진입 직전 화면(상세)으로 돌아가도록 router.back() 사용 → 히스토리 중복 방지.
export function ProgramEditScaffold({ title, isDirty, isSaving, onSave, children }: Props) {
    const router = useRouter();
    const { open: openModal, close: closeModal } = useModal();

    const handleBack = () => {
        if (!isDirty) {
            router.back();
            return;
        }
        openModal(
            <Modal
                title="변경사항을 저장하지 않고 나가시겠어요?"
                description="저장하지 않은 내용은 사라집니다."
                confirmLabel="나가기"
                cancelLabel="계속 수정"
                danger
                onConfirm={() => {
                    closeModal();
                    router.back();
                }}
                onCancel={closeModal}
            />,
        );
    };

    useHeaderOverride({ title, onBack: handleBack, hideRightAction: true, guardDirty: isDirty });

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* 폼 영역 */}
            <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-4">{children}</div>

            {/* 저장 버튼 */}
            <BottomBar>
                <Button className="w-full" disabled={!isDirty || isSaving} onClick={onSave}>
                    {isSaving ? '저장 중...' : '저장하기'}
                </Button>
            </BottomBar>
        </div>
    );
}
