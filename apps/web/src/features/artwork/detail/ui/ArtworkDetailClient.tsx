'use client';

import type { ArtworkPhoto } from '@todam/shared';

import { Stepper } from '@/entities/artwork';
import { ApiError } from '@/shared/api';
import { useModal } from '@/shared/model';
import { useArtworkDetail } from '../queries';

import { ArtworkDetailEmpty } from './ArtworkDetailEmpty';
import { ArtworkDetailError } from './ArtworkDetailError';

// 작품 이미지 확대 패널 (Figma `8505:16496`). 오버레이·Esc·닫기는 전역 AppModal 이 처리.
// 원본 imageUrl 렌더. 리사이징은 next/image 위임.
function ArtworkImageView({ photo }: { photo: ArtworkPhoto }) {
    const src = photo.imageUrl;
    return (
        <div
            className="h-80 w-80 overflow-hidden rounded-[32px] bg-muted"
            onClick={(e) => e.stopPropagation()}
        >
            <img src={src} alt="작품 이미지" className="h-full w-full object-cover" />
        </div>
    );
}

// 작품 상세 클라이언트.
// 서버 컴포넌트(page.tsx) 가 artworkId 만 넘기고 동적 동작은 본 컴포넌트가 캡슐화.
// - react-query useArtworkDetail
// - 401 → 전역 인증 에러 핸들러
// - 403/404 → 안내 메시지
// - 사진 클릭 → ImageModal 노출
// - timeline 빈 배열 → ArtworkDetailEmpty
//
// 화면 bg는 plan §Design tokens — bg-background (#FBF8F3 = gold-50).
export type ArtworkDetailClientProps = {
    artworkId: string;
};

export function ArtworkDetailClient({ artworkId }: ArtworkDetailClientProps) {
    const { data, error, isLoading, isError } = useArtworkDetail(artworkId);
    const { open: openModal } = useModal();

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
        // 401은 전역 인증 에러 핸들러가 처리한다.
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
                        onSelectPhoto={(photo) => openModal(<ArtworkImageView photo={photo} />)}
                    />
                </div>
            )}
        </main>
    );
}
