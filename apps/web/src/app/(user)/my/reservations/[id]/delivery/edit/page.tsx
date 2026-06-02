import { DeliveryEditClient } from '../../../../../../../features/reservation/delivery-edit';

// 서버 컴포넌트. params(Promise) 만 풀고 클라이언트로 reservationId 전달.
// 동적 동작(react-query / 폼 / 401 리다이렉트 / 가드)은 DeliveryEditClient 에서 캡슐화.
type DeliveryEditPageProps = {
    params: Promise<{ id: string }>;
};

export default async function DeliveryEditPage({ params }: DeliveryEditPageProps) {
    const { id } = await params;
    return <DeliveryEditClient reservationId={id} />;
}
