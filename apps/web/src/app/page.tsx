import { RecentReservationSection } from '@/features/reservation/recent';
import { NearbyStoresSection } from '@/features/store/nearby-list';

export default function HomePage() {
    return (
        <>
            <main className="flex-1 overflow-y-auto">
                {/* hero: 메인 비주얼 콘텐츠 배치 영역 */}
                <section className="flex h-56 items-center justify-center bg-primary-subtle text-primary">
                    Hero 콘텐츠 배치
                </section>

                {/* Container: 좌/우 패딩 + 섹션 간 gap */}
                <div className="flex flex-col gap-6 px-4 py-6">
                    {/* 최근 예약: 최신 예약 1건 위젯 (plan: 최근 예약 조회.md) */}
                    <RecentReservationSection />

                    {/* 근처 공방: 위치 기반 공방 목록 (커서 무한스크롤) */}
                    <NearbyStoresSection />
                </div>
            </main>
        </>
    );
}
