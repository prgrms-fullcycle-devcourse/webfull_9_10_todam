import { ReserveClient } from '@/features/reservation/create';

// 예약 신청 페이지

interface ReservePageProps {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{
        title?: string;
        price?: string;
        deliverable?: string;
        count?: string;
    }>;
}

export default async function ReservePage({ params, searchParams }: ReservePageProps) {
    const { id: programId } = await params;
    const sp = await searchParams;

    const programTitle = sp?.title ?? '클래스';
    const price = sp?.price ? Number(sp.price) : 0;
    const deliverable = sp?.deliverable === 'true';
    const parsedCount = sp?.count ? Number(sp.count) : 1;
    const initialParticipantCount =
        Number.isFinite(parsedCount) && parsedCount >= 1 ? Math.floor(parsedCount) : 1;

    // 래퍼 없이 직접 반환 — ReserveClient 가 main(flex-1)+BottomBar 형제 구조라
    // (user) 레이아웃 flex 컬럼의 직속 자식이어야 BottomBar 가 하단 고정된다.
    return (
        <ReserveClient
            programId={programId}
            programTitle={programTitle}
            price={price}
            deliverable={deliverable}
            initialParticipantCount={initialParticipantCount}
        />
    );
}
