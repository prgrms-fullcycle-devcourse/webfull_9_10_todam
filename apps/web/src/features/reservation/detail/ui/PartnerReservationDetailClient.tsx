'use client';

import { useMemo, useRef, useState, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import {
    BottomBar,
    Button,
    CalendarIcon,
    ClockIcon,
    Modal,
    NametagIcon,
    PhoneIcon,
    QrcodeIcon,
    SendIcon,
    TextArea,
    UserIcon,
    type IconProps,
} from '@todam/ui';
import {
    formatScheduled,
    formatYmdHm,
    formatYmdWithDay,
    ReservationStatus,
    type PartnerReservationAction,
    type PartnerReservationDetail,
} from '@todam/shared';

import { ApiError } from '@/shared/api';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useModal, useToast } from '@/shared/model';
import { ResultTable, type ResultTableRow } from '@/shared/ui';

import {
    useCancelPartnerReservationMutation,
    useCompletePartnerReservationMutation,
    useConfirmPartnerReservationMutation,
    usePartnerReservationDetail,
    useRejectPartnerReservationMutation,
    useUpdatePartnerReservationInternalMemoMutation,
} from '@/entities/reservation';

type PartnerReservationDetailClientProps = {
    reservationId: string;
};

type DetailHeader = {
    title: string;
    description: string;
};

type MemoDraft = {
    reservationId: string;
    saved: string;
    value: string;
};

type DetailVisibility = {
    showContactActions: boolean;
    showQrAction: boolean;
    showRejectAction: boolean;
    showConfirmAction: boolean;
    showCancelAction: boolean;
    showCompleteAction: boolean;
    showArtworkButton: boolean;
    hasBottomActions: boolean;
    contactGridClassName: string;
};

type DetailActionButtonProps = {
    label: string;
    Icon: ComponentType<IconProps>;
    onClick: () => void;
};

function DetailActionButton({ label, Icon, onClick }: DetailActionButtonProps) {
    return (
        <button
            type="button"
            className="flex h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-border-subtle bg-surface px-4 text-xs font-semibold"
            onClick={onClick}
        >
            <Icon size={24} />
            {label}
        </button>
    );
}

function hasAction(reservation: PartnerReservationDetail, action: PartnerReservationAction) {
    return reservation.availableActions.includes(action);
}

function getDetailHeader(reservation: PartnerReservationDetail): DetailHeader {
    switch (reservation.status) {
        case ReservationStatus.IN_PROGRESS:
            return {
                title: '체험이 완료되었어요',
                description: '수강생에게 리뷰 작성 알림을 전송했어요.',
            };
        case ReservationStatus.CONFIRMED:
            return {
                title: '확정된 예약이에요',
                description: '체험이 완료되면 수강생에게 리뷰 작성 알림을 보내드려요.',
            };
        case ReservationStatus.CANCELED:
            return {
                title: '취소된 예약이에요',
                description: reservation.canceledAt
                    ? `${formatYmdHm(reservation.canceledAt)}에 취소되었어요.`
                    : '예약이 취소되었어요.',
            };
        default:
            return {
                title: '대기 중인 예약이에요',
                description: '아래 정보를 확인하고 예약을 확정해 주세요.',
            };
    }
}

function getDetailVisibility(reservation: PartnerReservationDetail): DetailVisibility {
    const isPending = reservation.status === ReservationStatus.PENDING;
    const isCanceled = reservation.status === ReservationStatus.CANCELED;
    const isConfirmed = reservation.status === ReservationStatus.CONFIRMED;

    // QR 라벨은 artwork(=artworkId)가 있어야 생성 가능 → 없으면 진입점 비표시(plan 결정4).
    const showQrAction = !isPending && !isCanceled && Boolean(reservation.artworkId);
    const showRejectAction = hasAction(reservation, 'REJECT');
    const showConfirmAction = hasAction(reservation, 'CONFIRM');
    const showCancelAction = !isPending && hasAction(reservation, 'CANCEL');
    const showCompleteAction = isConfirmed || hasAction(reservation, 'COMPLETE');
    const showArtworkButton =
        !isPending && !isConfirmed && !isCanceled && Boolean(reservation.artworkId);

    return {
        showContactActions: !isCanceled,
        showQrAction,
        showRejectAction,
        showConfirmAction,
        showCancelAction,
        showCompleteAction,
        showArtworkButton,
        hasBottomActions:
            showRejectAction ||
            showConfirmAction ||
            showCancelAction ||
            showCompleteAction ||
            showArtworkButton,
        contactGridClassName: showQrAction ? 'grid-cols-3' : 'grid-cols-2',
    };
}

function buildRows(reservation: PartnerReservationDetail): ResultTableRow[] {
    const { time } = formatScheduled(reservation.scheduledAt);
    return [
        {
            icon: <CalendarIcon size={16} />,
            label: '날짜',
            value: formatYmdWithDay(reservation.scheduledAt),
        },
        { icon: <ClockIcon size={16} />, label: '시간', value: time },
        {
            icon: <UserIcon size={16} />,
            label: '인원',
            value: `${reservation.participantCount}명`,
        },
        { icon: <NametagIcon size={16} />, label: '예약자', value: reservation.reserverName },
        { icon: <PhoneIcon size={16} />, label: '연락처', value: reservation.reserverPhone },
    ];
}

function getDetailViewModel(reservation: PartnerReservationDetail) {
    return {
        header: getDetailHeader(reservation),
        visibility: getDetailVisibility(reservation),
    };
}

export function PartnerReservationDetailClient({
    reservationId,
}: PartnerReservationDetailClientProps) {
    const router = useRouter();
    const { open: openModal, close: closeModal } = useModal();
    const { push: pushToast } = useToast();
    const { data, error, isError, isLoading } = usePartnerReservationDetail(reservationId);
    const reservation = data?.reservation;

    const [memoDraft, setMemoDraft] = useState<MemoDraft | null>(null);
    const isLeavingRef = useRef(false);

    const confirmMutation = useConfirmPartnerReservationMutation(reservationId);
    const rejectMutation = useRejectPartnerReservationMutation(reservationId);
    const cancelMutation = useCancelPartnerReservationMutation(reservationId);
    const completeMutation = useCompletePartnerReservationMutation(reservationId);
    const updateMemoMutation = useUpdatePartnerReservationInternalMemoMutation(reservationId);

    const initialMemo = reservation?.internalMemo ?? '';
    const currentMemoDraft =
        memoDraft && memoDraft.reservationId === reservation?.id ? memoDraft : null;
    const memo = currentMemoDraft?.value ?? initialMemo;
    const savedMemo = currentMemoDraft?.saved ?? initialMemo;
    const isMemoDirty = memo !== savedMemo;

    const navigateToCalendar = () => {
        router.push('/partner/reservations');
    };

    const handleBack = () => {
        if (isLeavingRef.current) return;

        if (!isMemoDirty) {
            navigateToCalendar();
            return;
        }

        openModal(
            <Modal
                title="저장하지 않고 나갈까요?"
                description="작성 중인 내부 메모가 저장되지 않습니다."
                cancelLabel="계속 작성"
                confirmLabel="나가기"
                onCancel={closeModal}
                onConfirm={() => {
                    isLeavingRef.current = true;
                    setMemoDraft((current) =>
                        current && current.reservationId === reservationId
                            ? { ...current, saved: current.value }
                            : current,
                    );
                    closeModal();
                    window.setTimeout(navigateToCalendar, 0);
                }}
            />,
        );
    };

    useHeaderOverride({
        title: '예약 자세히보기',
        onBack: handleBack,
        hideRightAction: true,
        guardDirty: isMemoDirty,
    });

    const rows = useMemo(() => (reservation ? buildRows(reservation) : []), [reservation]);

    const openActionModal = (
        title: string,
        confirmLabel: string,
        onConfirm: () => void,
        danger = false,
    ) => {
        openModal(
            <Modal
                title={title}
                cancelLabel="취소"
                confirmLabel={confirmLabel}
                danger={danger}
                onCancel={closeModal}
                onConfirm={() => {
                    closeModal();
                    onConfirm();
                }}
            />,
        );
    };

    const handleSaveMemo = () => {
        if (!reservation || updateMemoMutation.isPending) return;
        // OD-1: 빈 문자열은 null 로 정규화해 전송.
        const trimmed = memo.trim();
        updateMemoMutation.mutate(
            { internalMemo: trimmed === '' ? null : memo },
            {
                onSuccess: () => {
                    setMemoDraft((current) =>
                        current && current.reservationId === reservationId
                            ? { ...current, saved: current.value }
                            : current,
                    );
                    pushToast({ message: '내부 메모가 저장되었어요.' });
                },
                onError: () => {
                    pushToast({ message: '메모 저장에 실패했습니다.' });
                },
            },
        );
    };

    // 체험 완료: BE가 체험 시각 전(400 EXPERIENCE_NOT_STARTED)·미확정(409) 등으로 거부하면
    // 사용자에게 사유를 토스트로 안내한다(무반응처럼 보이던 문제 해결).
    const handleComplete = () => {
        completeMutation.mutate(undefined, {
            onError: (err) => {
                const message =
                    err instanceof ApiError && err.code === 'EXPERIENCE_NOT_STARTED'
                        ? '아직 체험 시작 날짜 전이에요. 체험일 이후에 완료할 수 있어요.'
                        : err instanceof ApiError && err.code === 'INVALID_RESERVATION_STATUS'
                          ? '확정된 예약만 체험 완료할 수 있어요.'
                          : '체험 완료 처리에 실패했어요. 잠시 후 다시 시도해 주세요.';
                pushToast({ message });
            },
        });
    };

    const handleCall = () => {
        if (!reservation?.reserverPhone) return;
        window.location.href = `tel:${reservation.reserverPhone}`;
    };

    const handleMessage = () => {
        if (!reservation?.reserverPhone) return;
        window.location.href = `sms:${reservation.reserverPhone}`;
    };

    if (isLoading) {
        return (
            <main className="flex-1 overflow-y-auto px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    예약 상세를 불러오는 중입니다.
                </p>
            </main>
        );
    }

    if (isError && error instanceof ApiError) {
        if (error.statusCode === 401) return null;
        const message =
            error.statusCode === 404
                ? '예약을 찾을 수 없습니다.'
                : error.statusCode === 403
                  ? '해당 예약에 대한 접근 권한이 없습니다.'
                  : '예약 상세 정보를 불러오지 못했습니다.';
        return (
            <main className="flex-1 overflow-y-auto px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">{message}</p>
            </main>
        );
    }

    if (!reservation) {
        return (
            <main className="flex-1 overflow-y-auto px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    예약 정보를 불러오지 못했습니다.
                </p>
            </main>
        );
    }

    const { header, visibility } = getDetailViewModel(reservation);

    return (
        <>
            <main className="flex-1 overflow-y-auto px-4 pb-6">
                <div className="flex flex-col gap-6 py-6">
                    <section className="flex flex-col gap-2">
                        <h1 className="text-2xl font-semibold leading-8 text-foreground">
                            {header.title}
                        </h1>
                        <p className="text-lg text-foreground-secondary">{header.description}</p>
                    </section>

                    <section className="flex flex-col gap-2">
                        <ResultTable
                            title={reservation.programTitle}
                            storeName={`예약번호 ${reservation.reservationNumber}`}
                            rows={rows}
                        />

                        {visibility.showContactActions && (
                            <div className={`grid gap-2 ${visibility.contactGridClassName}`}>
                                <DetailActionButton
                                    label="전화 걸기"
                                    Icon={PhoneIcon}
                                    onClick={handleCall}
                                />
                                <DetailActionButton
                                    label="문자 보내기"
                                    Icon={SendIcon}
                                    onClick={handleMessage}
                                />
                                {visibility.showQrAction && (
                                    <DetailActionButton
                                        label="QR 조회"
                                        Icon={QrcodeIcon}
                                        onClick={() =>
                                            router.push(
                                                `/partner/reservations/${reservation.id}/qr`,
                                            )
                                        }
                                    />
                                )}
                            </div>
                        )}
                    </section>

                    <TextArea
                        label="내부 메모"
                        actionLabel={
                            isMemoDirty
                                ? updateMemoMutation.isPending
                                    ? '저장 중...'
                                    : '저장하기'
                                : undefined
                        }
                        onActionClick={handleSaveMemo}
                        value={memo}
                        maxLength={200}
                        showCount
                        placeholder="전화 예약 / 현장 결제 예정 / 1명 추가 가능성 있음"
                        onChange={(e) => {
                            const value = e.target.value;
                            setMemoDraft((current) =>
                                current
                                    ? { ...current, value }
                                    : {
                                          reservationId: reservation.id,
                                          saved: reservation.internalMemo ?? '',
                                          value,
                                      },
                            );
                        }}
                        className="min-h-[132px]"
                    />
                </div>
            </main>

            {visibility.hasBottomActions && (
                <BottomBar className="gap-3">
                    {(visibility.showRejectAction || visibility.showConfirmAction) && (
                        <div className="flex w-full gap-3">
                            {visibility.showRejectAction && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-14 flex-1"
                                    disabled={rejectMutation.isPending}
                                    onClick={() =>
                                        openActionModal('예약을 거절할까요?', '거절하기', () =>
                                            rejectMutation.mutate({
                                                rejectReason: '파트너가 예약을 거절했습니다.',
                                            }),
                                        )
                                    }
                                >
                                    거절하기
                                </Button>
                            )}
                            {visibility.showConfirmAction && (
                                <Button
                                    size="sm"
                                    className="h-14 flex-1"
                                    disabled={confirmMutation.isPending}
                                    onClick={() =>
                                        openActionModal('예약을 확정할까요?', '확정하기', () =>
                                            confirmMutation.mutate(),
                                        )
                                    }
                                >
                                    확정하기
                                </Button>
                            )}
                        </div>
                    )}

                    {(visibility.showCancelAction || visibility.showCompleteAction) && (
                        <div className="flex w-full gap-3">
                            {visibility.showCancelAction && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-14 flex-1"
                                    disabled={cancelMutation.isPending}
                                    onClick={() =>
                                        openActionModal(
                                            '예약을 취소할까요?',
                                            '예약 취소',
                                            () =>
                                                cancelMutation.mutate({
                                                    cancelReason: '파트너가 예약을 취소했습니다.',
                                                }),
                                            true,
                                        )
                                    }
                                >
                                    예약 취소
                                </Button>
                            )}
                            {visibility.showCompleteAction && (
                                <Button
                                    size="sm"
                                    className="h-14 flex-1"
                                    disabled={completeMutation.isPending}
                                    onClick={() =>
                                        openActionModal(
                                            '체험을 완료할까요?',
                                            '체험 완료하기',
                                            handleComplete,
                                        )
                                    }
                                >
                                    체험 완료하기
                                </Button>
                            )}
                        </div>
                    )}

                    {visibility.showArtworkButton && (
                        <Button
                            size="sm"
                            className="h-14 w-full"
                            onClick={() =>
                                router.push(`/partner/artworks/${reservation.artworkId}`)
                            }
                        >
                            작품 관리로 이동
                        </Button>
                    )}
                </BottomBar>
            )}
        </>
    );
}
