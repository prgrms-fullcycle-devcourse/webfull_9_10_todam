import { RecentReservationSection } from '@/features/reservation/recent';
import { NearbyStudiosSection } from '@/features/studio/nearby-list';

export default function HomePage() {
    return (
        <>
            <main className="flex-1 overflow-y-auto px-4 pb-6">
                <RecentReservationSection />
                <NearbyStudiosSection />
            </main>
        </>
    );
}
