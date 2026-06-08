import { PartnerReservationDetailClient } from '@/features/reservation/detail';

type PartnerReservationDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default async function PartnerReservationDetailPage({
    params,
}: PartnerReservationDetailPageProps) {
    const { id } = await params;
    return <PartnerReservationDetailClient reservationId={id} />;
}
