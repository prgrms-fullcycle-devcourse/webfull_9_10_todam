import { ReviewDetailClient } from './_components/ReviewDetailClient';

// 서버 컴포넌트. 동적 동작(react-query / 401 리다이렉트 / 헤더 액션 / Menu / Modal)은
// ReviewDetailClient 로 캡슐화. Next 15 패턴: params 가 Promise — 비동기로 풀어 전달.
type ReviewDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
    const { id } = await params;
    return <ReviewDetailClient reservationId={id} />;
}
