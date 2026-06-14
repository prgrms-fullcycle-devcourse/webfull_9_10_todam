'use client';

import { StoreEditErrorCode } from '@todam/shared';
import { BottomBar, Button, ConfirmIcon, Modal } from '@todam/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { ApiError } from '@/shared/api';
import { useModal, useToast } from '@/shared/model';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { detailToForm, type EditSection } from '../model/types';
import {
    buildImageIds,
    buildPatchBody,
    isDirty,
    isSectionValid,
    useStudioEditStore,
} from '../model/studio';
import {
    useAddStudioImage,
    useDeleteStudioImage,
    useStudioDetail,
    useUpdateStudio,
} from '../queries';
import { InfoEditSection } from './InfoEditSection';
import { OperatingEditSection } from './OperatingEditSection';
import { ReservationEditSection } from './ReservationEditSection';

const SECTION_TITLE: Record<EditSection, string> = {
    info: '공방 정보 수정',
    operating: '영업 정보 수정',
    reservation: '예약 정보 수정',
};

export type StudioEditLayoutProps = {
    storeId: string;
    section: EditSection;
    // 닫기/저장 후 복귀 기준 경로. 기본: 공방 상세.
    returnTo?: string;
};

export function StudioEditLayout({ storeId, section, returnTo }: StudioEditLayoutProps) {
    const router = useRouter();
    const detailQuery = useStudioDetail(storeId);
    const updateMutation = useUpdateStudio(storeId);
    const addImageMutation = useAddStudioImage(storeId);
    const deleteImageMutation = useDeleteStudioImage(storeId);

    const form = useStudioEditStore((s) => s.form);
    const initial = useStudioEditStore((s) => s.initial);
    const pendingImages = useStudioEditStore((s) => s.pendingImages);
    const deletedImageIds = useStudioEditStore((s) => s.deletedImageIds);
    const load = useStudioEditStore((s) => s.load);
    const reset = useStudioEditStore((s) => s.reset);
    const setSlugDuplicated = useStudioEditStore((s) => s.setSlugDuplicated);

    const { push } = useToast();
    const { open, close } = useModal();

    // 공방 상세는 전역 currentStore 기반 단수 라우트(/partner/store). storeId 파라미터 경로 제거됨.
    const backPath = returnTo ?? '/partner/studio';

    // GET preload → 폼 기본값 주입.
    useEffect(() => {
        if (detailQuery.data) {
            load(detailToForm(detailQuery.data.store));
        }
    }, [detailQuery.data, load]);

    // 화면 이탈 시 폼 초기화.
    useEffect(() => () => reset(), [reset]);

    const isSaving =
        updateMutation.isPending || addImageMutation.isPending || deleteImageMutation.isPending;
    const dirty = isDirty(form, initial, pendingImages.length);
    const valid = isSectionValid(form, section, pendingImages.length);
    const canSave = dirty && valid && !isSaving;

    const leave = () => {
        reset();
        router.push(backPath);
    };

    // 이탈 가드: dirty 시 확인 다이얼로그.
    const handleBack = () => {
        if (!dirty) {
            leave();
            return;
        }
        open(
            <Modal
                title="변경사항을 저장하지 않고 나갈까요?"
                description="저장하지 않은 변경사항은 사라져요."
                confirmLabel="나가기"
                cancelLabel="계속 작성"
                danger
                onConfirm={() => {
                    close();
                    leave();
                }}
                onCancel={close}
            />,
        );
    };

    // 전역 Header override: 섹션별 동적 타이틀 + 뒤로가기(이탈 가드). 우측 액션 없음.
    useHeaderOverride({
        title: SECTION_TITLE[section],
        onBack: handleBack,
        hideRightAction: true,
        guardDirty: dirty,
    });

    const handleSave = async () => {
        if (!form || !initial || !canSave) return;
        const body = buildPatchBody(form, initial, section);
        try {
            // 정보 섹션: 이미지 삭제 → 신규 업로드(presigned+PUT+confirm) → 최종 id 목록 PATCH.
            if (section === 'info') {
                for (const imageId of deletedImageIds) {
                    await deleteImageMutation.mutateAsync(imageId);
                }
                const uploadedIds: string[] = [];
                for (const pending of pendingImages) {
                    const uploaded = await addImageMutation.mutateAsync({
                        file: pending.file,
                        isThumbnail: pending.isThumbnail,
                    });
                    uploadedIds.push(uploaded.id);
                }
                const imageIds = buildImageIds(form, initial, uploadedIds);
                if (imageIds) body.images = imageIds;
            }
            await updateMutation.mutateAsync(body);

            reset();
            push({
                message: '수정된 공방 정보가 반영되었어요',
                type: 'icon',
                icon: <ConfirmIcon size={16} />,
            });
            // 파트너 전용 공방 상세로 이동(slug 공개 URL 아님). storeId 기반.
            router.push(backPath);
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.code === StoreEditErrorCode.STORE_SLUG_DUPLICATED) {
                    setSlugDuplicated(true);
                    push({ message: '이미 사용 중인 공방 URL입니다.' });
                } else if (err.code === StoreEditErrorCode.FORBIDDEN) {
                    push({ message: '이 공방을 수정할 권한이 없어요.' });
                } else if (err.code === StoreEditErrorCode.STORE_NOT_FOUND) {
                    push({ message: '공방을 찾을 수 없어요.' });
                } else {
                    push({ message: err.message });
                }
            } else {
                push({ message: '저장 중 오류가 발생했습니다.' });
            }
        }
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-16">
                {detailQuery.isLoading || !form ? (
                    <div className="flex flex-1 items-center justify-center py-20 text-sm text-foreground-tertiary">
                        불러오는 중...
                    </div>
                ) : detailQuery.isError ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
                        <p className="text-sm text-foreground-tertiary">
                            공방 정보를 불러오지 못했어요.
                        </p>
                        <Button variant="ghost" size="sm" onClick={() => detailQuery.refetch()}>
                            다시 시도
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 py-2">
                        {section === 'info' && <InfoEditSection storeId={storeId} />}
                        {section === 'operating' && <OperatingEditSection />}
                        {section === 'reservation' && <ReservationEditSection />}
                    </div>
                )}
            </div>

            <BottomBar>
                <Button className="w-full" disabled={!canSave} onClick={handleSave}>
                    {isSaving ? '저장 중...' : '저장'}
                </Button>
            </BottomBar>
        </div>
    );
}
