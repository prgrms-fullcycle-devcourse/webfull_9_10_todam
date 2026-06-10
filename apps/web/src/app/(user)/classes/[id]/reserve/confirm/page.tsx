import { ReserveConfirmClient } from '@/features/reservation/create';

// 예약 완료 화면.
// ReserveClient 에서 POST /reservations 성공 후 sessionStorage 에 저장한 결과를 표시.
// 래퍼 없이 직접 반환 — ReserveConfirmClient 가 main(flex-1)+BottomBar 형제 구조.

export default function ReserveConfirmPage() {
    return <ReserveConfirmClient />;
}
