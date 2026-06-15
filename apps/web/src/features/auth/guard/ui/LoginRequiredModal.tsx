'use client';

import { Modal } from '@todam/ui';

// 로그인 필요 안내 모달(공용). RequireAuth(진입 후 가드)·useLoginRequiredGuard(클릭 가로채기) 공유.
export function LoginRequiredModal({
    onCancel,
    onConfirm,
}: {
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <Modal
            type="shortText"
            title="로그인이 필요해요"
            description="로그인 후 다시 이용해 주세요."
            cancelLabel="닫기"
            confirmLabel="로그인하기"
            onCancel={onCancel}
            onConfirm={onConfirm}
        />
    );
}
