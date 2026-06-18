'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { ALLOWED_IMAGE_TYPES, MAX_REVIEW_PHOTO_COUNT, formatScheduled } from '@todam/shared';
import type { ReviewDetail } from '@todam/shared';
import { BottomBar, Button, Modal, RatingInput, SectionTitle, TextArea } from '@todam/ui';

import { useReservationDetail, useReservationReview } from '@/entities/reservation';
import { ApiError } from '@/shared/api';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { getFileValidationIssues } from '@/shared/lib/imageFile';
import { useModal, useToast } from '@/shared/model';
import { usePendingImages, type ExistingImage } from '@/shared/model';
import { PendingImageField } from '@/shared/ui';

import { uploadReviewImage, uploadToS3 } from '../api';
import { useCreateReviewMutation, useUpdateReviewMutation } from '../queries';

const CONTENT_MAX = 500;
const ACCEPT = ALLOWED_IMAGE_TYPES.join(',');

export type ReviewFormClientProps = {
    reservationId: string;
    // 'write' = 신규 작성, 'edit' = 기존 리뷰 수정(prefill).
    mode: 'write' | 'edit';
};

// 외부 래퍼 — 수정 모드는 GET prefill 도착 후에만 폼(Inner)을 마운트.
// usePendingImages 는 초기 existing 배열을 mount 시점에만 받으므로, prefill 데이터가
// 준비된 뒤 Inner 를 마운트해 기존 photos 를 한 번에 주입한다.
export function ReviewFormClient({ reservationId, mode }: ReviewFormClientProps) {
    const isEdit = mode === 'edit';
    const { data: reviewData, isLoading } = useReservationReview(reservationId, isEdit);

    if (isEdit && isLoading) {
        return (
            <div className="px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    리뷰를 불러오는 중입니다.
                </p>
            </div>
        );
    }

    return (
        <ReviewFormInner
            reservationId={reservationId}
            isEdit={isEdit}
            initialReview={isEdit ? reviewData?.review : undefined}
        />
    );
}

type ReviewFormInnerProps = {
    reservationId: string;
    isEdit: boolean;
    initialReview?: ReviewDetail;
};

function ReviewFormInner({ reservationId, isEdit, initialReview }: ReviewFormInnerProps) {
    const router = useRouter();
    const { push } = useToast();
    const { open, close } = useModal();

    // 작품 정보 헤더(클래스명 + 공방・체험일).
    const { data: reservationData } = useReservationDetail(reservationId);
    const reservation = reservationData?.reservation;

    const reviewId = initialReview?.id ?? '';

    // ─── 폼 상태(수정 모드는 기존 값으로 초기화) ──────────────────
    const [rating, setRating] = useState(initialReview?.rating ?? 0);
    const [content, setContent] = useState(initialReview?.content ?? '');
    const [submitting, setSubmitting] = useState(false);

    // 기존 photos{id,imageUrl}[] → ExistingImage{ id, src: imageUrl }.
    const images = usePendingImages<ExistingImage>(
        (initialReview?.photos ?? []).map((p) => ({ id: p.id, src: p.imageUrl })),
    );

    const createMutation = useCreateReviewMutation(reservationId);
    const updateMutation = useUpdateReviewMutation(reviewId, reservationId);

    // dirty: 작성=입력 발생 / 수정=초기값 대비 변경.
    const contentDirty = isEdit ? content !== (initialReview?.content ?? '') : content.length > 0;
    const ratingDirty = isEdit ? rating !== (initialReview?.rating ?? 0) : rating > 0;
    const dirty = ratingDirty || contentDirty || images.isDirty;

    const canSubmit = rating >= 1 && !submitting;
    const handleAddImages = (files: File[]) => {
        const issues = getFileValidationIssues(files);
        const remaining =
            MAX_REVIEW_PHOTO_COUNT - images.existingImages.length - images.pendingImages.length;
        if (issues.oversized) {
            push({ message: '5MB를 초과한 이미지는 추가할 수 없어요. 최대 파일 용량은 5MB예요.' });
        } else if (issues.unsupported) {
            push({ message: 'JPG, PNG, HEIC 형식의 이미지만 추가할 수 있어요.' });
        } else if (files.length > remaining) {
            push({ message: `사진은 최대 ${MAX_REVIEW_PHOTO_COUNT}장까지 추가할 수 있어요.` });
        }
        images.addFiles(files.slice(0, remaining));
    };

    // ─── 이탈 가드 ───────────────────────────────────────────────
    const leave = () => router.push(`/my/reservations/${reservationId}`);
    const handleClose = () => {
        if (!dirty) {
            leave();
            return;
        }
        open(
            <Modal
                type="shortText"
                title={isEdit ? '리뷰 수정을 중단할까요?' : '리뷰 작성을 중단할까요?'}
                description="지금 나가면 쓴 내용이 모두 사라져요."
                cancelLabel="계속하기"
                confirmLabel="나가기"
                onCancel={close}
                onConfirm={() => {
                    close();
                    leave();
                }}
            />,
        );
    };

    // 전역 Header — popup(좌측 close-X → 이탈 가드). 우측 액션 없음.
    useHeaderOverride({
        type: 'popup',
        onClose: handleClose,
        onBack: handleClose,
        hideRightAction: true,
        guardDirty: dirty,
    });

    // ─── 제출 흐름 (plan §A-3~5 / §B-3~5) ────────────────────────
    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            // 1) pendingImages 만 presigned → S3 PUT 으로 업로드해 key 수집.
            const uploadedKeys: string[] = [];
            for (const pending of images.pendingImages) {
                const { uploadUrl, key } = await uploadReviewImage({
                    fileName: pending.file.name,
                    fileType: pending.file.type,
                });
                await uploadToS3(uploadUrl, pending.file);
                uploadedKeys.push(key);
            }

            // 2) 유지 existing photo + 신규 key 합본 → 최종 photos[].
            // 유지 사진은 ExistingImage.src(= GET 응답 imageUrl 전체 URL)를 그대로 전달한다.
            // BE buildReviewPhotos 는 'http'로 시작하는 값을 기존 imageUrl 로 처리(S3 key 변환 불필요).
            // GET 응답이 S3 key 를 직접 노출하지 않으므로 imageUrl 경유가 유일한 정합 경로.
            const keptKeys = images.existingImages.map((img) => img.src);
            const photos = [...keptKeys, ...uploadedKeys];

            const body = {
                rating,
                content: content.length > 0 ? content : undefined,
                photos: photos.length > 0 ? photos : undefined,
            };

            if (isEdit) {
                await updateMutation.mutateAsync(body);
            } else {
                await createMutation.mutateAsync(body);
            }
            // 성공 시 mutation onSuccess 가 toast + invalidate + 다음 화면 이동 처리.
        } catch (err) {
            // mutation onError 가 ApiError 토스트 처리. presigned/S3 단계 실패만 별도 안내.
            if (!(err instanceof ApiError)) {
                push({ message: '사진 업로드 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const scheduled = reservation ? formatScheduled(reservation.scheduledAt) : null;

    return (
        // 래퍼가 main 높이를 채우고(flex-1) 콘텐츠가 grow → sticky BottomBar 하단 고정(#434 패턴).
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-24 pt-2">
                {/* 작품 정보 헤더 */}
                {reservation && (
                    <div className="flex flex-col">
                        <SectionTitle title={reservation.programTitle} size="md" />
                        {scheduled && (
                            <p className="text-xs text-foreground-tertiary">
                                {reservation.storeName}・{scheduled.date} ({scheduled.day})
                            </p>
                        )}
                    </div>
                )}

                {/* 상단 카피 + 별점(필수) */}
                <div className="flex flex-col items-center gap-4 py-2">
                    <h1 className="text-lg font-bold text-foreground">이번 체험은 어떠셨나요?</h1>
                    <RatingInput value={rating} onChange={setRating} />
                </div>

                {/* 본문 (선택, 0/500자) */}
                <TextArea
                    label="어떤 점이 좋았나요?"
                    optional
                    placeholder="체험에서 좋았던 점을 알려주세요"
                    showCount
                    maxLength={CONTENT_MAX}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />

                {/* 리뷰 사진 (선택, 최대 3장) */}
                <PendingImageField
                    label="사진"
                    existingImages={images.existingImages}
                    pendingImages={images.pendingImages}
                    onAdd={handleAddImages}
                    onRemoveExisting={images.removeExisting}
                    onRemovePending={images.removePending}
                    max={MAX_REVIEW_PHOTO_COUNT}
                    multiple
                    accept={ACCEPT}
                    alt="리뷰 사진"
                />
            </div>

            <BottomBar>
                <Button className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
                    {submitting
                        ? isEdit
                            ? '수정 중...'
                            : '등록 중...'
                        : isEdit
                          ? '수정 완료'
                          : '리뷰 등록'}
                </Button>
            </BottomBar>
        </div>
    );
}
