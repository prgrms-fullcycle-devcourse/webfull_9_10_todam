/**
 * BullMQ 'notification' 큐 job payload 타입.
 * NotificationService.createAndDispatch 에서 enqueue 할 때 사용.
 */
export interface NotificationJobPayload {
    /** DB Notification.id */
    notificationId: string;
    /** 수신자 userId */
    recipientId: string;
    /** 알림 제목 */
    title: string;
    /** 알림 본문 */
    body: string;
    /** 딥링크 (optional) */
    deepLink?: string;
}
