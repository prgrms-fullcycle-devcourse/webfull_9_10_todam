import { ReservationDetailClient } from './_components/ReservationDetailClient';

// 서버 컴포넌트. 동적 동작(react-query / 401 리다이렉트 / 헤더 액션 / Modal)은
// ReservationDetailClient 로 캡슐화. 페이지 자체에는 'use client' 불필요.
// Next 15 패턴: params 가 Promise — 비동기로 풀어 reservationId 전달.
type ReservationDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default async function ReservationDetailPage({ params }: ReservationDetailPageProps) {
    const { id } = await params;
    return <ReservationDetailClient reservationId={id} />;
}
