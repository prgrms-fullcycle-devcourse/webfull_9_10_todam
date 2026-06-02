'use client';

import { Modal } from '@todam/ui';

// 리뷰 삭제 confirm 모달 — Figma 정본(`8507:23893`/`8507:24023`) 기준.
// 선행 CancelDialog 패턴 재사용 + 텍스트·색 교체.
export type DeleteReviewDialogProps = {
    onConfirm: () => void;
    onClose: () => void;
};

export function DeleteReviewDialog({ onConfirm, onClose }: DeleteReviewDialogProps) {
    return (
        <Modal
            type="shortText"
            title="리뷰를 삭제할까요?"
            description="삭제한 리뷰는 되돌릴 수 없어요."
            cancelLabel="취소"
            confirmLabel="삭제하기"
            danger
            onCancel={onClose}
            onConfirm={() => {
                onConfirm();
                onClose();
            }}
        />
    );
}
