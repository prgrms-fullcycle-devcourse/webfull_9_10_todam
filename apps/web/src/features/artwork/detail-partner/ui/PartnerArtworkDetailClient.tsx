'use client';

// 파트너 작품 상세 클라이언트.
// Plan step 10: FE 상세 — 타임라인, 수령방식카드, 예약정보 바텀시트, 현재 상태별 CTA.

import { useRouter } from 'next/navigation';
import { RightIcon, BottomBar, Button, Modal } from '@todam/ui';
import {
    ArtworkAvailableAction,
    ArtworkStatus,
    DeliveryCarrier,
    ReservationDeliveryMethod,
} from '@todam/shared';

import { ApiError } from '@/shared/api';
import { uploadToPresignedUrl } from '@/shared/api/uploadToPresignedUrl';
import { useModal, useSheet, useToast } from '@/shared/model';

import {
    usePartnerArtworkDetail,
    useUpdateArtworkStatus,
    usePhotoPresign,
    useConfirmArtworkPhoto,
    useDeleteArtworkPhoto,
    useUpdateArtworkDelivery,
} from '../queries';
import { buildPartnerTimeline } from '../timeline';
import { PartnerArtworkStepper } from './PartnerArtworkStepper';
import { PartnerReservationInfoSheet } from './PartnerReservationInfoSheet';

export type PartnerArtworkDetailClientProps = {
    artworkId: string;
};

// 현재 status → 다음 단계 CTA 라벨 맵.
// Decision Log: UPDATE_STATUS → '다음단계 라벨'
const NEXT_STATUS_MAP: Partial<Record<string, { label: string; nextStatus: ArtworkStatus }>> = {
    [ArtworkStatus.RESERVED]: { label: '체험 완료', nextStatus: ArtworkStatus.DRYING },
    [ArtworkStatus.DRYING]: { label: '초벌 시작', nextStatus: ArtworkStatus.BISQUE_FIRING },
    [ArtworkStatus.BISQUE_FIRING]: { label: '유약 시작', nextStatus: ArtworkStatus.GLAZING },
    [ArtworkStatus.GLAZING]: { label: '재벌 시작', nextStatus: ArtworkStatus.GLAZE_FIRING },
    [ArtworkStatus.GLAZE_FIRING]: { label: '제작 완료', nextStatus: ArtworkStatus.COMPLETED },
};

export function PartnerArtworkDetailClient({ artworkId }: PartnerArtworkDetailClientProps) {
    const router = useRouter();
    const { data, error, isLoading, isError } = usePartnerArtworkDetail(artworkId);
    const { open } = useSheet();
    const { push } = useToast();
    const { open: openModal, close: closeModal } = useModal();

    const { mutate: updateStatus, isPending: isStatusPending } = useUpdateArtworkStatus(artworkId);
    const { mutateAsync: presignPhotos } = usePhotoPresign(artworkId);
    const { mutateAsync: confirmPhoto } = useConfirmArtworkPhoto(artworkId);
    const { mutate: deletePhoto } = useDeleteArtworkPhoto(artworkId);
    const { mutate: updateDelivery, isPending: isDeliveryPending } =
        useUpdateArtworkDelivery(artworkId);

    // 로딩
    if (isLoading) {
        return (
            <main className="flex-1 overflow-y-auto bg-background px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    작품 정보를 불러오는 중입니다.
                </p>
            </main>
        );
    }

    // 에러
    if (isError && error instanceof ApiError) {
        if (error.statusCode === 401) return null;
        return (
            <main className="flex-1 overflow-y-auto bg-background px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    {error.statusCode === 403
                        ? '이 작품에 접근할 권한이 없습니다.'
                        : error.statusCode === 404
                          ? '작품을 찾을 수 없습니다.'
                          : '작품 정보를 불러오지 못했습니다.'}
                </p>
            </main>
        );
    }

    const artwork = data?.artwork;
    if (!artwork) {
        return (
            <main className="flex-1 overflow-y-auto bg-background px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    작품 정보를 불러오지 못했습니다.
                </p>
            </main>
        );
    }

    // artwork 가 undefined 아님을 확인했으므로 non-null 상수로 바인딩 (closure 타입 추론)
    const safeArtwork = artwork;
    const timelineRows = buildPartnerTimeline(safeArtwork);

    // 수령 방식 라벨
    const deliveryMethodLabel =
        safeArtwork.deliveryMethod === ReservationDeliveryMethod.DELIVERY
            ? '택배 수령'
            : '직접 수령';

    // CTA 계산
    const ctaInfo = resolveCta({
        status: safeArtwork.status,
        availableAction: safeArtwork.availableAction,
    });

    // 사진 첨부: 공용 ImageUploadGrid 가 파일 선택을 담당.
    // 선택 완료된 files 로 presign → S3 PUT → confirm 순차 처리.
    async function handleUpload(_rowKey: string, artworkLogId: string, files: File[]) {
        if (files.length === 0) return;

        try {
            const result = await presignPhotos({
                artworkLogId,
                files: files.map((f) => ({
                    filename: f.name,
                    fileSize: f.size,
                    contentType: f.type as 'image/jpeg' | 'image/png' | 'image/heic',
                })),
            });

            for (let i = 0; i < result.photos.length; i++) {
                const presigned = result.photos[i];
                const file = files[i];
                if (!presigned || !file) continue;

                await uploadToPresignedUrl(presigned.uploadUrl, file);
                await confirmPhoto(presigned.photoId);
            }
        } catch {
            push({ message: '사진 업로드에 실패했습니다. 다시 시도해주세요.' });
        }
    }

    // 사진 삭제 핸들러
    function handleRemovePhoto(rowKey: string, index: number) {
        // timeline rows 에서 해당 row 의 photos[index] 찾아 photoId 결정
        const row = timelineRows.find((r) => r.key === rowKey);
        if (!row) return;

        // photos 는 TimelineImage(src/alt) 이므로 artwork의 timeline 데이터에서 photoId 역추적
        const stage = safeArtwork.timeline.find((t) => t.stage === rowKey);
        const photo = stage?.photos[index];
        if (!photo) return;

        deletePhoto(photo.id);
    }

    // 예약 정보 바텀시트 오픈
    function handleOpenReservationSheet() {
        open(<PartnerReservationInfoSheet reservation={safeArtwork.reservation} />);
    }

    // 수령 방식·배송 정보 입력 화면으로 이동.
    function goToDeliveryInfo() {
        router.push(`/partner/artworks/${artworkId}/shipping`);
    }

    // CTA 핸들러
    function handleCtaClick() {
        if (!ctaInfo) return;

        switch (ctaInfo.type) {
            case 'UPDATE_STATUS':
                updateStatus({ status: ctaInfo.nextStatus });
                return;
            case 'SHIP': {
                // SHIP 은 배송 필수 정보(운송장/택배사/발송일) 필요.
                // carrier 는 contract enum 이어야 하므로 캐스트 대신 값 검증.
                const d = safeArtwork.delivery;
                if (!d?.trackingNumber || !d?.shippedAt || !isDeliveryCarrier(d.carrier)) {
                    push({
                        message: '작품 수령 정보가 필요합니다.',
                        type: 'button',
                        actionLabel: '입력하기',
                        onAction: goToDeliveryInfo,
                    });
                    return;
                }
                updateDelivery({
                    action: 'SHIP',
                    trackingNumber: d.trackingNumber,
                    carrier: d.carrier,
                    shippedAt: d.shippedAt,
                });
                return;
            }
            case 'PICKUP_READY':
                updateDelivery({ action: 'PICKUP_READY' });
                return;
            case 'PICKUP_DONE':
                openConfirm(
                    '픽업을 완료할까요?',
                    '이전 상태로 되돌릴 수 없습니다.',
                    '픽업 완료',
                    () => updateDelivery({ action: 'PICKUP_DONE' }),
                );
                return;
            case 'DELIVERED':
                openConfirm(
                    '배송을 완료할까요?',
                    '이전 상태로 되돌릴 수 없습니다.',
                    '배송 완료',
                    () => updateDelivery({ action: 'DELIVERED' }),
                );
                return;
            default:
                // 케이스 누락 시 컴파일 에러로 강제.
                ctaInfo satisfies never;
        }
    }

    // 확인 모달 헬퍼. 확인 시 close 후 onConfirm.
    function openConfirm(
        title: string,
        description: string,
        confirmLabel: string,
        onConfirm: () => void,
    ) {
        openModal(
            <Modal
                title={title}
                description={description}
                cancelLabel="취소"
                confirmLabel={confirmLabel}
                onCancel={closeModal}
                onConfirm={() => {
                    closeModal();
                    onConfirm();
                }}
            />,
        );
    }

    const isPending = isStatusPending || isDeliveryPending;

    return (
        <>
            <main className="flex-1 overflow-y-auto">
                <div className="px-4 pb-16">
                    <section className="flex flex-col gap-2 py-2">
                        {/* 수령 방식 카드 */}
                        <div className="rounded-2xl border border-border bg-surface p-4">
                            <button
                                type="button"
                                className="flex w-full cursor-pointer items-center justify-between"
                                onClick={goToDeliveryInfo}
                            >
                                <div className="flex flex-col gap-0.5 text-left">
                                    <span className="text-xs text-foreground-tertiary">
                                        작품 수령 방식
                                    </span>
                                    <span className="text-base font-semibold text-foreground">
                                        {deliveryMethodLabel}
                                    </span>
                                </div>
                                <RightIcon size={20} className="text-foreground-tertiary" />
                            </button>
                        </div>
                        <section className="flex flex-col gap-2 py-2">
                            {/* 타임라인 스텝퍼 */}
                            <PartnerArtworkStepper
                                rows={timelineRows}
                                onUpload={(rowKey, logId, files) => {
                                    void handleUpload(rowKey, logId, files);
                                }}
                                onRemovePhoto={handleRemovePhoto}
                            />
                        </section>
                    </section>
                </div>
            </main>

            {/* 하단 액션바 (공용 BottomBar) */}
            <BottomBar>
                <div className="flex w-full gap-2">
                    <Button
                        variant="outline"
                        className="h-14 flex-1"
                        onClick={handleOpenReservationSheet}
                    >
                        예약 정보
                    </Button>
                    {ctaInfo && (
                        <Button
                            className="h-14 flex-1"
                            disabled={isPending}
                            onClick={handleCtaClick}
                        >
                            {isPending ? '처리 중...' : ctaInfo.label}
                        </Button>
                    )}
                </div>
            </BottomBar>
        </>
    );
}

// delivery.carrier(string|null) 가 contract enum 값인지 검증하는 타입 가드.
type DeliveryCarrierValue = (typeof DeliveryCarrier)[keyof typeof DeliveryCarrier];
function isDeliveryCarrier(value: string | null): value is DeliveryCarrierValue {
    return value !== null && (Object.values(DeliveryCarrier) as string[]).includes(value);
}

// CTA 정보 계산.
type CtaInfo =
    | { type: 'UPDATE_STATUS'; label: string; nextStatus: ArtworkStatus }
    | { type: 'SHIP'; label: string }
    | { type: 'PICKUP_READY'; label: string }
    | { type: 'PICKUP_DONE'; label: string }
    | { type: 'DELIVERED'; label: string }
    | null;

type ArtworkForCta = {
    status: string;
    availableAction: string[];
};

function resolveCta(artwork: ArtworkForCta): CtaInfo {
    // availableAction 우선순위: SHIP > PICKUP_DONE > PICKUP_READY > DELIVERED > UPDATE_STATUS
    const { availableAction, status } = artwork;

    if (availableAction.includes(ArtworkAvailableAction.SHIP)) {
        return { type: 'SHIP', label: '배송 시작' };
    }
    if (availableAction.includes(ArtworkAvailableAction.PICKUP_DONE)) {
        return { type: 'PICKUP_DONE', label: '픽업 완료' };
    }
    if (availableAction.includes(ArtworkAvailableAction.PICKUP_READY)) {
        return { type: 'PICKUP_READY', label: '픽업 준비' };
    }
    if (availableAction.includes(ArtworkAvailableAction.DELIVERED)) {
        return { type: 'DELIVERED', label: '배송 완료 처리' };
    }
    if (availableAction.includes(ArtworkAvailableAction.UPDATE_STATUS)) {
        const next = NEXT_STATUS_MAP[status];
        if (!next) return null;
        return { type: 'UPDATE_STATUS', label: next.label, nextStatus: next.nextStatus };
    }

    return null;
}
