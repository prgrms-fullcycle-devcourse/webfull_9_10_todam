import { PartnerReservationQrClient } from '@/features/reservation/qr';

type PartnerReservationQrPageProps = {
    params: Promise<{ id: string }>;
};

export default async function PartnerReservationQrPage({ params }: PartnerReservationQrPageProps) {
    const { id } = await params;
    return <PartnerReservationQrClient reservationId={id} />;
}
