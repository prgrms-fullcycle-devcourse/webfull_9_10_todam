'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { ArtworkPhoto } from '@todam/shared';

import { Stepper } from '@/entities/artwork';
import { ApiError } from '@/shared/api';
import { useArtworkDetail } from '../queries';

import { ArtworkDetailEmpty } from './ArtworkDetailEmpty';
import { ArtworkDetailError } from './ArtworkDetailError';
import { ImageModal } from './ImageModal';

// 작품 상세 클라이언트.
// 서버 컴포넌트(page.tsx) 가 artworkId 만 넘기고 동적 동작은 본 컴포넌트가 캡슐화.
// - react-query useArtworkDetail
// - 401 → /login 리다이렉트 (선행 예약 상세 패턴 일치)
// - 403/404 → 안내 메시지
// - 사진 클릭 → ImageModal 노출
// - timeline 빈 배열 → ArtworkDetailEmpty
//
// 화면 bg는 plan §Design tokens — bg-background (#FBF8F3 = gold-50).
export type ArtworkDetailClientProps = {
    artworkId: string;
};

export function ArtworkDetailClient({ artworkId }: ArtworkDetailClientProps) {
    const router = useRouter();
    const { data, error, isLoading, isError } = useArtworkDetail(artworkId);
    const [selectedPhoto, setSelectedPhoto] = useState<ArtworkPhoto | null>(null);

    // 401 → /login 리다이렉트 (선행 예약 상세 패턴 일치).
    useEffect(() => {
        if (isError && error instanceof ApiError && error.statusCode === 401) {
            router.replace('/login');
        }
    }, [isError, error, router]);

    if (isLoading) {
        return (
            <main className="flex-1 overflow-y-auto bg-background px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    작품 정보를 불러오는 중입니다.
                </p>
            </main>
        );
    }

    if (isError && error instanceof ApiError) {
        // 401 은 리다이렉트 처리 — 메시지 분기에서 제외.
        if (error.statusCode === 401) return null;
        return (
            <main className="flex-1 overflow-y-auto bg-background px-4 pb-16">
                <ArtworkDetailError statusCode={error.statusCode} />
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

    return (
        <main className="flex-1 overflow-y-auto bg-background px-4 pb-16">
            {artwork.timeline.length === 0 ? (
                <ArtworkDetailEmpty />
            ) : (
                <div className="pt-0">
                    <Stepper
                        timeline={artwork.timeline}
                        onSelectPhoto={(photo) => setSelectedPhoto(photo)}
                    />
                </div>
            )}

            {selectedPhoto && (
                <ImageModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
            )}
        </main>
    );
}
