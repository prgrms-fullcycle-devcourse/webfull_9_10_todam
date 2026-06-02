'use client';

import { useEffect } from 'react';

import type { ArtworkPhoto } from '@todam/shared';

// 이미지 확대 모달 (Figma `8505:16496`).
// - Overlay: bg-inverse/80 (#0E1218 80%).
// - Container: 320×320 radius 32, bg-muted (#F1F2F4).
// - D1 폴백: imageUrl 없으면 thumbnailUrl 사용 (BE 정본 갱신 전 임시).
// - Dismiss: overlay tap, Esc key, back gesture (browser back은 라우터 미사용 — Esc/overlay 만).
export type ImageModalProps = {
    photo: ArtworkPhoto;
    onClose: () => void;
};

export function ImageModal({ photo, onClose }: ImageModalProps) {
    // D1: BE 정본은 thumbnailUrl만 보장. imageUrl 있으면 우선.
    const src = photo.imageUrl ?? photo.thumbnailUrl;

    // Esc 키로 닫기.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="작품 이미지 보기"
            className="fixed inset-0 z-50 flex items-center justify-center bg-inverse/80"
            onClick={onClose}
        >
            <div
                className="h-80 w-80 overflow-hidden rounded-[32px] bg-muted"
                onClick={(e) => e.stopPropagation()}
            >
                <img src={src} alt="작품 이미지" className="h-full w-full object-cover" />
            </div>
        </div>
    );
}
