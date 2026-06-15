'use client';

import { useRouter } from 'next/navigation';

import { Divider, EditIcon, PinIcon, SectionTitle } from '@todam/ui';
import type { ReservationDetail } from '@todam/shared';

import { EmptyBox } from '@/shared/ui';
import { useToast } from '@/shared/model';

// 디자인 정본 (변형 A/B/C) — 배송 정보 섹션.
// 빈 상태 (변형 A): "작품을 받을 주소를 미리 입력해 볼까요?" + "배송지 입력하기" 버튼
// 입력됨 (변형 B/C): 수령인 + 주소 + (운송장 박스 — 미발송/발송)
// 운송장 발송 = trackingNumber + carrier 모두 truthy
export type DeliveryInfoSectionProps = {
    reservation: ReservationDetail;
};

export function DeliveryInfoSection({ reservation }: DeliveryInfoSectionProps) {
    const router = useRouter();
    const { push } = useToast();
    const delivery = reservation.delivery;
    const hasDelivery = Boolean(delivery && delivery.address);
    const hasTracking = Boolean(delivery?.trackingNumber && delivery?.carrier);

    const goToDeliveryEdit = () => {
        router.push(`/my/reservations/${reservation.id}/delivery/edit`);
    };

    const handleCopyTracking = async () => {
        if (!delivery?.trackingNumber) return;
        try {
            await navigator.clipboard.writeText(delivery.trackingNumber);
            push({ message: '운송장 번호를 복사했어요.' });
        } catch {
            push({ message: '복사에 실패했어요.' });
        }
    };

    return (
        <section className="flex w-full flex-col gap-2">
            {hasDelivery ? (
                <div className="flex w-full items-center justify-between py-2">
                    <span className="text-lg font-semibold text-foreground">배송 정보</span>
                    <button
                        type="button"
                        onClick={goToDeliveryEdit}
                        className="flex items-center gap-1 text-xs text-foreground-tertiary"
                    >
                        <EditIcon size={16} />
                        수정하기
                    </button>
                </div>
            ) : (
                <SectionTitle title="배송 정보" size="md" />
            )}

            {!hasDelivery ? (
                <EmptyBox
                    description="작품을 받을 주소를 미리 입력해 볼까요?"
                    actionLabel="배송지 입력하기"
                    action={goToDeliveryEdit}
                />
            ) : (
                <>
                    <div className="flex w-full flex-col rounded-2xl bg-surface px-4 py-2">
                        <div className="flex flex-col gap-1 py-2">
                            <span className="text-lg font-semibold text-foreground">
                                {delivery!.recipientName}
                            </span>
                            <span className="text-xs text-foreground-tertiary">
                                {delivery!.recipientPhone}
                            </span>
                        </div>

                        <Divider />

                        <div className="flex items-start gap-2 py-3">
                            <div className="flex w-16 items-center gap-1 text-sm text-foreground-tertiary">
                                <PinIcon size={16} />
                                <span>주소</span>
                            </div>
                            <span className="flex-1 text-right text-sm font-semibold text-foreground">
                                {delivery!.address}
                            </span>
                        </div>
                    </div>

                    {/* 운송장 박스 — 미발송 vs 발송됨 */}
                    <div className="flex h-10 w-full items-center justify-between rounded-xl bg-muted px-4">
                        {hasTracking ? (
                            <>
                                <div className="flex items-center gap-1 truncate">
                                    <span className="text-xs font-medium text-foreground-secondary">
                                        {delivery!.carrier}
                                    </span>
                                    <span className="text-xs text-foreground-tertiary">
                                        {delivery!.trackingNumber}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopyTracking}
                                    className="shrink-0 text-xs font-semibold text-foreground-tertiary"
                                >
                                    복사하기
                                </button>
                            </>
                        ) : (
                            <p className="text-xs text-foreground-secondary">
                                작품 배송이 시작되면 운송장 번호를 알려드릴게요
                            </p>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
