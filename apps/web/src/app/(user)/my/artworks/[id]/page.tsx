import { ArtworkDetailClient } from '../../../../../features/artwork/detail';

// 서버 컴포넌트. 동적 동작(react-query / 401 리다이렉트 / 이미지 모달)은
// ArtworkDetailClient 로 캡슐화. 페이지 자체에는 'use client' 불필요.
// Next 15 패턴: params 가 Promise — 비동기로 풀어 artworkId 전달.
type ArtworkDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default async function ArtworkDetailPage({ params }: ArtworkDetailPageProps) {
    const { id } = await params;
    return <ArtworkDetailClient artworkId={id} />;
}
