'use client';

import { useRouter } from 'next/navigation';

import {
    MAX_PROGRAM_IMAGE_COUNT,
    ProgramDifficulty,
    type PartnerProgramDetail,
} from '@todam/shared';

import { ApiError } from '@/shared/api';
import { useToast } from '@/shared/model/toast';
import { validateDescription, validateTitle } from '@/entities/program';
import { usePendingImages } from '@/shared/model';
import { PendingImageField } from '@/shared/ui';
import { useEditableForm } from '@/shared/lib/useEditableForm';
import { useFormValidation } from '@/shared/lib/useFormValidation';
import { useDeleteProgramImage, usePatchProgram, useUploadProgramImage } from '../queries';
import { ProgramEditScaffold } from './ProgramEditScaffold';
import { ProgramInfoEditForm, type ProgramInfoFields } from './ProgramInfoEditForm';

type Props = {
    programId: string;
    program: PartnerProgramDetail;
};

export function ProgramInfoEditScreen({ programId, program }: Props) {
    const router = useRouter();
    const { push: pushToast } = useToast();

    // 서버 데이터 baseline → 폼 1회 초기화 + dirty 파생
    const baseline: ProgramInfoFields = {
        title: program.title,
        description: program.description ?? '',
        difficulty: program.difficulty ?? ProgramDifficulty.BASIC,
    };
    const { form: fields, patch, isDirty: fieldsDirty } = useEditableForm(baseline);

    // 파트너 상세 이미지 → ExistingImage(id, src) 매핑.
    const images = usePendingImages(
        program.images.map((img) => ({
            ...img,
            id: img.programImageId,
            src: img.thumbnailUrl ?? img.imageUrl,
        })),
    );

    const isDirty = fieldsDirty || images.isDirty;

    // ─── 유효성 검사 ─────────────────────────────────────────────
    const { errors, validate } = useFormValidation<ProgramInfoFields>({
        title: validateTitle,
        description: validateDescription,
    });

    // ─── mutations ──────────────────────────────────────────────
    const storeId = program.storeId;
    const patchMutation = usePatchProgram(storeId, programId);
    const uploadMutation = useUploadProgramImage(storeId, programId);
    const deleteImageMutation = useDeleteProgramImage(storeId, programId);

    const isSaving =
        patchMutation.isPending || uploadMutation.isPending || deleteImageMutation.isPending;

    // ─── 저장 ────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!validate(fields) || isSaving) return;

        try {
            // 1. 제거된 기존 이미지 삭제
            //    신규(대기) 이미지는 서버 미반영 상태라 로컬 제거로 끝 — DELETE 불필요
            for (const imageId of images.deletedImageIds) {
                await deleteImageMutation.mutateAsync(imageId);
            }

            // 2. 신규 이미지 업로드 (presigned URL → S3 PUT)
            for (const pending of images.pendingImages) {
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
                title: fields.title,
                description: fields.description || null,
                difficulty: fields.difficulty,
            });

            pushToast({ message: '수정된 클래스 정보가 반영되었어요.' });
            // 저장 성공 → 진입 직전(상세)으로 복귀. 상세는 onSuccess invalidate 로 재조회됨.
            router.back();
        } catch (err) {
            if (err instanceof ApiError) {
                pushToast({ message: err.message });
            } else {
                pushToast({ message: '저장 중 오류가 발생했어요. 다시 시도해 주세요.' });
            }
        }
    };

    return (
        <ProgramEditScaffold
            title="기본 정보 수정"
            isDirty={isDirty}
            isSaving={isSaving}
            onSave={handleSave}
        >
            <div className="flex flex-col gap-4">
                <PendingImageField
                    label="클래스 이미지"
                    existingImages={images.existingImages}
                    pendingImages={images.pendingImages}
                    onAdd={images.addFiles}
                    onRemoveExisting={images.removeExisting}
                    onRemovePending={images.removePending}
                    max={MAX_PROGRAM_IMAGE_COUNT}
                    multiple={false}
                    alt="클래스 이미지"
                />
                <ProgramInfoEditForm fields={fields} errors={errors} onChange={patch} />
            </div>
        </ProgramEditScaffold>
    );
}
