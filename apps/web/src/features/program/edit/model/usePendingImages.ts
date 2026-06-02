'use client';

import { useCallback, useState } from 'react';

import type { ProgramImage } from '@todam/shared';

import { filterValidImageFiles } from '../../../../shared/lib/imageFile';
import type { PendingImage } from './types';

export interface PendingImagesState {
    existingImages: ProgramImage[];
    pendingImages: PendingImage[];
    deletedImageIds: string[];
}

// 기존/신규/삭제 예정 이미지 상태와 추가·삭제 핸들러를 캡슐화.
// 파일 검증(타입·크기)과 objectURL 정리도 함께 담당.
export function usePendingImages(initialExisting: ProgramImage[]) {
    const [state, setState] = useState<PendingImagesState>(() => ({
        existingImages: initialExisting,
        pendingImages: [],
        deletedImageIds: [],
    }));

    // 검증 통과 파일만 추가. 기존·신규 이미지가 모두 없을 때 첫 파일을 대표로 지정.
    const addFiles = useCallback((files: File[]) => {
        const valid = filterValidImageFiles(files);
        if (valid.length === 0) return;
        setState((prev) => {
            const empty = prev.existingImages.length === 0 && prev.pendingImages.length === 0;
            const added: PendingImage[] = valid.map((file, i) => ({
                file,
                previewUrl: URL.createObjectURL(file),
                isThumbnail: empty && i === 0,
            }));
            return { ...prev, pendingImages: [...prev.pendingImages, ...added] };
        });
    }, []);

    const removeExisting = useCallback((imageId: string) => {
        setState((prev) => ({
            ...prev,
            existingImages: prev.existingImages.filter((img) => img.programImageId !== imageId),
            deletedImageIds: [...prev.deletedImageIds, imageId],
        }));
    }, []);

    const removePending = useCallback((index: number) => {
        setState((prev) => {
            const updated = [...prev.pendingImages];
            const [removed] = updated.splice(index, 1);
            if (removed) URL.revokeObjectURL(removed.previewUrl);
            return { ...prev, pendingImages: updated };
        });
    }, []);

    const isDirty = state.pendingImages.length > 0 || state.deletedImageIds.length > 0;

    return {
        existingImages: state.existingImages,
        pendingImages: state.pendingImages,
        deletedImageIds: state.deletedImageIds,
        addFiles,
        removeExisting,
        removePending,
        isDirty,
    };
}
