import { ReserveClient } from '@/features/reservation/create';

// 예약 신청 페이지.
// params.id = programId (URL: /classes/{programId}/reserve)
// 프로그램 정보(title, price, deliverable)는 실 API 연동 전까지 ReserveClient에서 조회.
// ReserveClient 내부에서 슬롯 조회(GET /programs/:id/available-slots) + 예약 생성(POST /reservations)
// 모두 실 API로 연결됨.

interface ReservePageProps {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ title?: string; price?: string; deliverable?: string }>;
}

export default async function ReservePage({ params, searchParams }: ReservePageProps) {
    const { id: programId } = await params;
    const sp = await searchParams;

    // searchParams 로 클래스 상세에서 넘겨주는 정보 수신.
    // (클래스 상세 페이지 구현 후 Link href에 ?title=&price=&deliverable= 추가)
    // 없으면 기본값 — 실 API 연동 시 클래스 상세 데이터를 직접 prefetch 가능.
    const programTitle = sp?.title ?? '클래스';
    const price = sp?.price ? Number(sp.price) : 0;
    const deliverable = sp?.deliverable === 'true';

    return (
        <main>
            <ReserveClient
                programId={programId}
                programTitle={programTitle}
                price={price}
                deliverable={deliverable}
            />
        </main>
    );
}
