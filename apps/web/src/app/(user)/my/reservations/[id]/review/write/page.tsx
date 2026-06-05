import { ReviewFormClient } from '@/features/review/write';

// 서버 컴포넌트. params(Promise) unwrap 후 client 위임(기존 review/page.tsx 패턴).
// 작성 모드 — 리뷰 신규 작성 화면.
type ReviewWritePageProps = {
    params: Promise<{ id: string }>;
};

export default async function ReviewWritePage({ params }: ReviewWritePageProps) {
    const { id } = await params;
    return <ReviewFormClient reservationId={id} mode="write" />;
}
