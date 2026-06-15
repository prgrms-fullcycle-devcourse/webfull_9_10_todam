'use client';

import { Modal } from '@todam/ui';
import type { ReservationDetail } from '@todam/shared';

// 디자인 정본 (변형 D) — 예약 취소 Modal 2종.
// 가능 (`8505:15814`): "예약을 취소할까요?" / 유지하기·예약 취소하기(danger)
// 불가 (`8505:15825`): "예약 취소가 마감되었어요" / 닫기·공방에 문의하기(primary-darker)
export type CancelDialogProps = {
    reservation: ReservationDetail;
    onClose: () => void;
    onConfirmCancel?: () => void;
    onContactStore?: () => void;
};

export function CancelDialog({
    reservation,
    onClose,
    onConfirmCancel,
    onContactStore,
}: CancelDialogProps) {
    if (reservation.canCancel) {
        return (
            <Modal
                type="shortText"
                title="예약을 취소할까요?"
                description="취소 후에는 되돌릴 수 없어요."
                cancelLabel="유지하기"
                confirmLabel="예약 취소하기"
                danger
                onCancel={onClose}
                onConfirm={() => {
                    onConfirmCancel?.();
                    onClose();
                }}
            />
        );
    }

    const days = reservation.cancelDeadlineDays;
    const description =
        days != null
            ? `예약 취소는 체험 ${days}일 전까지 가능합니다. 취소를 원하시면 공방에 직접 문의해 주세요.`
            : '예약 취소가 마감되었습니다. 취소를 원하시면 공방에 직접 문의해 주세요.';

    return (
        <Modal
            type="shortText"
            title="예약 취소가 마감되었어요"
            description={description}
            cancelLabel="닫기"
            confirmLabel="공방에 문의하기"
            onCancel={onClose}
            onConfirm={() => {
                onContactStore?.();
                onClose();
            }}
        />
    );
}
