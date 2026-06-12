import { NotificationListClient } from '@/features/notification';

// 서버 컴포넌트. 동적 동작(react-query / 무한 스크롤)은 NotificationListClient로 캡슐화.
// 고객·파트너 공통 진입(헤더 알림 벨).
export default function NotificationsPage() {
    return <NotificationListClient />;
}
