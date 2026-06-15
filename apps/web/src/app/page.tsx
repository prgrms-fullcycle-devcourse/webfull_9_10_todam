import { RecentReservationSection } from '@/features/reservation/recent';
import { NearbyStudiosSection } from '@/features/studio/nearby-list';

export default function HomePage() {
    return (
        <div className="px-4 pb-6">
            <RecentReservationSection />
            <NearbyStudiosSection />
        </div>
    );
}
