'use client';

import { useCallback, useState } from 'react';

import { filterValidImageFiles } from '../lib/imageFile';

// 신규 업로드 대기 이미지.
export interface PendingImage {
    file: File;
    previewUrl: string;
    isThumbnail: boolean;
    // 업로드 완료 후 채워지는 서버 식별자/URL.
    uploadedId?: string;
    uploadedUrl?: string;
}

// 기존(서버) 이미지 최소 형태. 도메인별로 확장해 사용.
// id = 삭제·key 식별자, src = 썸네일 렌더 URL. PendingImageField 가 직접 소비.
export interface ExistingImage {
    id: string;
    src: string;
}

export interface PendingImagesState<T extends ExistingImage> {
    existingImages: T[];
    pendingImages: PendingImage[];
    deletedImageIds: string[];
}

// 기존/신규/삭제 예정 이미지 상태 + 추가·삭제 핸들러 캡슐화 (파일 검증·objectURL 정리 포함).
// 도메인 이미지 타입(T)은 ExistingImage 를 확장하면 그대로 사용 가능.
export function usePendingImages<T extends ExistingImage>(initialExisting: T[]) {
    const [state, setState] = useState<PendingImagesState<T>>(() => ({
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

    const removeExisting = useCallback((id: string) => {
        setState((prev) => ({
            ...prev,
            existingImages: prev.existingImages.filter((img) => img.id !== id),
            deletedImageIds: [...prev.deletedImageIds, id],
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
