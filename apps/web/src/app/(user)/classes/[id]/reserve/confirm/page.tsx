import { ReserveConfirmClient } from '@/features/reservation/create';

// 예약 완료 화면.
// ReserveClient 에서 POST /reservations 성공 후 sessionStorage 에 저장한 결과를
// ReserveConfirmClient 에서 읽어 displayState.label/description 표시.
// status PENDING vs CONFIRMED 분기 안내.

export default function ReserveConfirmPage() {
    return (
        <main>
            <ReserveConfirmClient />
        </main>
    );
}
