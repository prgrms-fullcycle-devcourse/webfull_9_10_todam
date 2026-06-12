/// <reference types="jest" />
import { NotificationWorker } from './notification.worker';
import type { Job } from 'bullmq';
import type { NotificationJobPayload } from './notification-job.type';

const NOTIFICATION_ID = 'notif-id-001';
const RECIPIENT_ID = 'user-id-001';
const TOKEN_ID = 'token-id-001';
const FCM_TOKEN = 'fcm-token-abc';

function makeJob(data: NotificationJobPayload, attemptsMade = 0): Job<NotificationJobPayload> {
    return { id: 'job-1', data, attemptsMade } as Job<NotificationJobPayload>;
}

function makePrisma(overrides: {
    settingResult?: { webPushEnabled: boolean } | null;
    tokens?: { id: string; fcmToken: string }[];
    deliveryId?: string;
    existingDelivery?: { id: string } | null;
}) {
    return {
        notificationSetting: {
            findUnique: jest
                .fn()
                .mockResolvedValue(overrides.settingResult ?? { webPushEnabled: true }),
        },
        notificationToken: {
            findMany: jest
                .fn()
                .mockResolvedValue(overrides.tokens ?? [{ id: TOKEN_ID, fcmToken: FCM_TOKEN }]),
            update: jest.fn().mockResolvedValue({}),
        },
        notificationDelivery: {
            // 기본: 기존 delivery 없음 → create 경로.
            findFirst: jest.fn().mockResolvedValue(overrides.existingDelivery ?? null),
            create: jest.fn().mockResolvedValue({ id: overrides.deliveryId ?? 'delivery-001' }),
            update: jest.fn().mockResolvedValue({}),
        },
    };
}

function makeFcm(
    sendResult:
        | { success: true; messageId: string }
        | { success: false; invalidToken: boolean; reason: string },
) {
    return { sendToToken: jest.fn().mockResolvedValue(sendResult) };
}

describe('NotificationWorker', () => {
    const BASE_PAYLOAD: NotificationJobPayload = {
        notificationId: NOTIFICATION_ID,
        recipientId: RECIPIENT_ID,
        title: 'Test title',
        body: 'Test body',
        deepLink: '/artworks/1',
    };

    it('webPushEnabled=false → WEB_PUSH skip, FCM 발송 없음', async () => {
        const prisma = makePrisma({ settingResult: { webPushEnabled: false } });
        const fcm = makeFcm({ success: true, messageId: 'msg-1' });
        const worker = new NotificationWorker(prisma as never, fcm as never);

        await worker.process(makeJob(BASE_PAYLOAD));

        expect(fcm.sendToToken).not.toHaveBeenCalled();
        expect(prisma.notificationDelivery.create).not.toHaveBeenCalled();
    });

    it('webPushEnabled=true, 성공 발송 → NotificationDelivery SENT 기록', async () => {
        const prisma = makePrisma({
            settingResult: { webPushEnabled: true },
            deliveryId: 'del-001',
        });
        const fcm = makeFcm({ success: true, messageId: 'msg-ok' });
        const worker = new NotificationWorker(prisma as never, fcm as never);

        await worker.process(makeJob(BASE_PAYLOAD));

        expect(prisma.notificationDelivery.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ status: 'PENDING', attempts: 1 }),
            }),
        );
        expect(prisma.notificationDelivery.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'del-001' },
                data: expect.objectContaining({ status: 'SENT' }),
            }),
        );
        expect(prisma.notificationToken.update).not.toHaveBeenCalled();
    });

    it('무효 토큰(invalidToken=true) → NotificationDelivery FAILED + 토큰 revokedAt 기록', async () => {
        const prisma = makePrisma({ deliveryId: 'del-002' });
        const fcm = makeFcm({
            success: false,
            invalidToken: true,
            reason: 'messaging/registration-token-not-registered',
        });
        const worker = new NotificationWorker(prisma as never, fcm as never);

        await worker.process(makeJob(BASE_PAYLOAD));

        expect(prisma.notificationDelivery.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ status: 'FAILED' }),
            }),
        );
        expect(prisma.notificationToken.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: TOKEN_ID },
                data: expect.objectContaining({ revokedAt: expect.any(Date) }),
            }),
        );
    });

    it('FCM 일반 실패(invalidToken=false) → FAILED 기록, 토큰 revoke 안 함', async () => {
        const prisma = makePrisma({ deliveryId: 'del-003' });
        const fcm = makeFcm({
            success: false,
            invalidToken: false,
            reason: 'messaging/internal-error',
        });
        const worker = new NotificationWorker(prisma as never, fcm as never);

        await worker.process(makeJob(BASE_PAYLOAD));

        expect(prisma.notificationDelivery.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    status: 'FAILED',
                    failedReason: 'messaging/internal-error',
                }),
            }),
        );
        expect(prisma.notificationToken.update).not.toHaveBeenCalled();
    });

    it('활성 토큰 없음 → 발송/기록 없이 skip', async () => {
        const prisma = makePrisma({ tokens: [] });
        const fcm = makeFcm({ success: true, messageId: 'msg-x' });
        const worker = new NotificationWorker(prisma as never, fcm as never);

        await worker.process(makeJob(BASE_PAYLOAD));

        expect(fcm.sendToToken).not.toHaveBeenCalled();
        expect(prisma.notificationDelivery.create).not.toHaveBeenCalled();
    });

    it('setting 레코드 없음(null) → webPushEnabled 기본 true 적용 → 정상 발송', async () => {
        const prisma = makePrisma({ settingResult: null, deliveryId: 'del-004' });
        const fcm = makeFcm({ success: true, messageId: 'msg-null' });
        const worker = new NotificationWorker(prisma as never, fcm as never);

        await worker.process(makeJob(BASE_PAYLOAD));

        expect(fcm.sendToToken).toHaveBeenCalled();
    });

    it('재시도(기존 delivery 존재) → 새 레코드 생성 없이 단일 레코드 attempts 갱신', async () => {
        const prisma = makePrisma({ existingDelivery: { id: 'del-existing' } });
        const fcm = makeFcm({ success: true, messageId: 'msg-retry' });
        const worker = new NotificationWorker(prisma as never, fcm as never);

        // attemptsMade=1 → 2번째 시도(첫 재시도). attempts=2.
        await worker.process(makeJob(BASE_PAYLOAD, 1));

        // 기존 레코드 재사용 → create 호출 안 함.
        expect(prisma.notificationDelivery.create).not.toHaveBeenCalled();
        expect(prisma.notificationDelivery.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'del-existing' },
                data: expect.objectContaining({ status: 'SENT', attempts: 2 }),
            }),
        );
    });
});
