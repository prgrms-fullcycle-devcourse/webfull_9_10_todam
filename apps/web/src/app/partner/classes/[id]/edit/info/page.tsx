'use client';

import { BottomBar, Button, Modal } from '@todam/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ProgramDifficulty, type ProgramImage } from '@todam/shared';

import { ApiError } from '../../../../../../shared/api';
import { useModal } from '../../../../../../shared/model/modal';
import { useToast } from '../../../../../../shared/model/toast';
import {
    useDeleteProgramImage,
    usePatchProgram,
    useProgramDetail,
    useUploadProgramImage,
} from '../../../../../../features/program/edit/queries';
import type {
    PendingImage,
    ProgramInfoFormState,
} from '../../../../../../features/program/edit/model/types';
import { useLeaveGuard } from '../../../../../../features/program/edit/model/useLeaveGuard';
import { ProgramInfoEditForm } from '../../../../../../features/program/edit/ui/ProgramInfoEditForm';

// preload용 mock slug. 실 연동 시 세션 또는 URL 파라미터로 교체.
const MOCK_SLUG = 'todam-pottery';

type PageProps = { params: Promise<{ id: string }> };

export default function PartnerClassEditInfoPage({ params }: PageProps) {
    // params는 Next.js 15+ async params
    const [programId, setProgramId] = useState<string>('');
    useEffect(() => {
        params.then((p) => setProgramId(p.id));
    }, [params]);

    const { data: detailData, isLoading } = useProgramDetail(MOCK_SLUG, programId);
    const program = detailData?.program;

    if (isLoading || !program) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <span className="text-sm text-foreground-tertiary">불러오는 중...</span>
            </div>
        );
    }

    // program 로드 완료 후 마운트 → 폼 초기값을 동기적으로 구성 (effect 불필요).
    return <EditInfoForm key={programId} programId={programId} program={program} />;
}

type EditInfoFormProps = {
    programId: string;
    program: NonNullable<ReturnType<typeof useProgramDetail>['data']>['program'];
};

function EditInfoForm({ programId, program }: EditInfoFormProps) {
    const router = useRouter();
    const { push: pushToast } = useToast();
    const { open: openModal, close: closeModal } = useModal();

    const storeId = program.storeId;

    // 서버 데이터로 폼 초기값 1회 구성 (lazy initializer — setState-in-effect 회피)
    const [form, setForm] = useState<ProgramInfoFormState>(() => ({
        title: program.title,
        description: program.description ?? '',
        difficulty: program.difficulty ?? ProgramDifficulty.BASIC,
        existingImages: program.images as ProgramImage[],
        pendingImages: [],
        deletedImageIds: [],
    }));

    // ─── dirty 판정 ─────────────────────────────────────────────
    const isDirty =
        form.title !== program.title ||
        form.description !== (program.description ?? '') ||
        form.difficulty !== (program.difficulty ?? ProgramDifficulty.BASIC) ||
        form.pendingImages.length > 0 ||
        form.deletedImageIds.length > 0;

    useLeaveGuard(isDirty);

    // ─── 유효성 검사 ─────────────────────────────────────────────
    const [errors, setErrors] = useState<Partial<Record<keyof ProgramInfoFormState, string>>>({});

    function validate(): boolean {
        const errs: Partial<Record<keyof ProgramInfoFormState, string>> = {};
        if (form.title.length < 2) errs.title = '클래스명은 2자 이상 입력해 주세요.';
        if (form.title.length > 60) errs.title = '클래스명은 60자 이하로 입력해 주세요.';
        if (form.description.length > 1000)
            errs.description = '상세 설명은 1000자 이하로 입력해 주세요.';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    // ─── mutations ──────────────────────────────────────────────
    const patchMutation = usePatchProgram(storeId, programId);
    const uploadMutation = useUploadProgramImage(storeId, programId);
    const deleteMutation = useDeleteProgramImage(storeId, programId);

    const isSaving =
        patchMutation.isPending || uploadMutation.isPending || deleteMutation.isPending;

    // ─── 이미지 이벤트 ──────────────────────────────────────────
    const handleImageAdd = (files: File[]) => {
        const newPending: PendingImage[] = files.map((file, i) => ({
            file,
            previewUrl: URL.createObjectURL(file),
            // 첫 번째 이미지이고 기존 이미지도 없으면 대표 이미지
            isThumbnail:
                form.existingImages.length === 0 && form.pendingImages.length === 0 && i === 0,
        }));
        setForm((prev) => ({ ...prev, pendingImages: [...prev.pendingImages, ...newPending] }));
    };

    const handleExistingImageRemove = (imageId: string) => {
        setForm((prev) => ({
            ...prev,
            existingImages: prev.existingImages.filter((img) => img.programImageId !== imageId),
            deletedImageIds: [...prev.deletedImageIds, imageId],
        }));
    };

    const handlePendingImageRemove = (index: number) => {
        setForm((prev) => {
            const updated = [...prev.pendingImages];
            URL.revokeObjectURL(updated[index]!.previewUrl);
            updated.splice(index, 1);
            return { ...prev, pendingImages: updated };
        });
    };

    // ─── 이탈 가드 ──────────────────────────────────────────────
    const handleBack = () => {
        if (!isDirty) {
            router.push(`/partner/classes/${programId}`);
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
                    router.push(`/partner/classes/${programId}`);
                }}
                onCancel={closeModal}
                onBackdropClick={closeModal}
            />,
        );
    };

    // ─── 저장 ────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!validate() || isSaving) return;

        try {
            // 1. 삭제 예정 이미지 먼저 삭제
            for (const imageId of form.deletedImageIds) {
                await deleteMutation.mutateAsync(imageId);
            }

            // 2. 신규 이미지 업로드 (presigned URL → S3 PUT)
            for (const pending of form.pendingImages) {
                await uploadMutation.mutateAsync({
                    pending,
                    req: {
                        fileName: pending.file.name,
                        fileType: pending.file.type,
                        isThumbnail: pending.isThumbnail,
                    },
                });
            }

            // 3. 기본 정보 PATCH
            await patchMutation.mutateAsync({
                title: form.title,
                description: form.description || null,
                difficulty: form.difficulty,
            });

            pushToast({ message: '수정된 클래스 정보가 반영되었어요.' });
            router.push(`/partner/classes/${programId}`);
        } catch (err) {
            if (err instanceof ApiError) {
                pushToast({ message: err.message });
            } else {
                pushToast({ message: '저장 중 오류가 발생했어요. 다시 시도해 주세요.' });
            }
        }
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* 헤더 */}
            <header className="flex h-15 shrink-0 items-center bg-transparent pt-safe">
                <button
                    type="button"
                    aria-label="뒤로가기"
                    onClick={handleBack}
                    className="flex h-14 w-14 items-center justify-center text-foreground"
                >
                    ←
                </button>
                <span className="flex-1 truncate text-lg font-medium leading-6 text-foreground">
                    기본 정보 수정
                </span>
            </header>

            {/* 폼 영역 */}
            <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-4">
                <ProgramInfoEditForm
                    form={form}
                    errors={errors}
                    onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                    onImageAdd={handleImageAdd}
                    onExistingImageRemove={handleExistingImageRemove}
                    onPendingImageRemove={handlePendingImageRemove}
                />
            </div>

            {/* 저장 버튼 */}
            <BottomBar>
                <Button className="w-full" disabled={!isDirty || isSaving} onClick={handleSave}>
                    {isSaving ? '저장 중...' : '저장하기'}
                </Button>
            </BottomBar>
        </div>
    );
}
