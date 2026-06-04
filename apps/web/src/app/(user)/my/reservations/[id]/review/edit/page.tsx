import { ReviewFormClient } from '@/features/review/write';

// 서버 컴포넌트. params(Promise) unwrap 후 client 위임(기존 review/page.tsx 패턴).
// 수정 모드 — 기존 리뷰 prefill 후 수정 화면.
type ReviewEditPageProps = {
    params: Promise<{ id: string }>;
};

export default async function ReviewEditPage({ params }: ReviewEditPageProps) {
    const { id } = await params;
    return <ReviewFormClient reservationId={id} mode="edit" />;
}
