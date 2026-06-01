import { ReservationsListClient } from './_components/ReservationsListClient';

// 서버 컴포넌트. 동적 동작(react-query / 401 리다이렉트 / 무한 스크롤)은
// ReservationsListClient 로 캡슐화. 페이지 자체에는 'use client' 불필요.
export default function ReservationsPage() {
    return <ReservationsListClient />;
}
