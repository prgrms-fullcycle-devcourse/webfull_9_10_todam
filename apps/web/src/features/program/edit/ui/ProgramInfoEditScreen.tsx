'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ProgramDifficulty, type ProgramDetail } from '@todam/shared';

import { ApiError } from '../../../../shared/api';
import { useToast } from '../../../../shared/model/toast';
import { validateDescription, validateTitle } from '../../../../entities/program';
import { useDeleteProgramImage, usePatchProgram, useUploadProgramImage } from '../queries';
import { usePendingImages } from '../model/usePendingImages';
import { ProgramEditScaffold } from './ProgramEditScaffold';
import { ProgramImageGrid } from './ProgramImageGrid';
import { ProgramInfoEditForm, type ProgramInfoFields } from './ProgramInfoEditForm';

type Props = {
    programId: string;
    program: ProgramDetail;
};

export function ProgramInfoEditScreen({ programId, program }: Props) {
    const router = useRouter();
    const { push: pushToast } = useToast();
    const backTo = `/partner/classes/${programId}`;

    // 서버 데이터로 폼 초기값 1회 구성 (lazy initializer — setState-in-effect 회피)
    const [fields, setFields] = useState<ProgramInfoFields>(() => ({
        title: program.title,
        description: program.description ?? '',
        difficulty: program.difficulty ?? ProgramDifficulty.BASIC,
    }));

    const images = usePendingImages(program.images);

    // ─── dirty 판정 ─────────────────────────────────────────────
    const fieldsDirty =
        fields.title !== program.title ||
        fields.description !== (program.description ?? '') ||
        fields.difficulty !== (program.difficulty ?? ProgramDifficulty.BASIC);
    const isDirty = fieldsDirty || images.isDirty;

    // ─── 유효성 검사 ─────────────────────────────────────────────
    const [errors, setErrors] = useState<Partial<Record<'title' | 'description', string>>>({});

    function validate(): boolean {
        const errs: Partial<Record<'title' | 'description', string>> = {};
        const titleError = validateTitle(fields.title);
        if (titleError) errs.title = titleError;
        const descError = validateDescription(fields.description);
        if (descError) errs.description = descError;
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    // ─── mutations ──────────────────────────────────────────────
    const storeId = program.storeId;
    const patchMutation = usePatchProgram(storeId, programId);
    const uploadMutation = useUploadProgramImage(storeId, programId);
    const deleteMutation = useDeleteProgramImage(storeId, programId);

    const isSaving =
        patchMutation.isPending || uploadMutation.isPending || deleteMutation.isPending;

    // ─── 저장 ────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!validate() || isSaving) return;

        try {
            // 1. 삭제 예정 이미지 먼저 삭제
            for (const imageId of images.deletedImageIds) {
                await deleteMutation.mutateAsync(imageId);
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
            router.push(backTo);
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
            backTo={backTo}
        >
            <div className="flex flex-col gap-4">
                <ProgramImageGrid
                    existingImages={images.existingImages}
                    pendingImages={images.pendingImages}
                    onAdd={images.addFiles}
                    onRemoveExisting={images.removeExisting}
                    onRemovePending={images.removePending}
                />
                <ProgramInfoEditForm
                    fields={fields}
                    errors={errors}
                    onChange={(patch) => setFields((prev) => ({ ...prev, ...patch }))}
                />
            </div>
        </ProgramEditScaffold>
    );
}
