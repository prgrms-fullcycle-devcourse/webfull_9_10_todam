/// <reference types="jest" />
import { NotificationService } from './notification.service';

const RECIPIENT_ID = 'user-001';
const NOTIFICATION_ID = 'notif-001';
const IDEM_KEY = 'U-ARTWORK_STATUS:art-001:user-001';

function makeParams(overrides = {}) {
    return {
        recipientId: RECIPIENT_ID,
        eventType: 'U-ARTWORK_STATUS',
        category: 'ARTWORK' as const,
        title: 'Test',
        body: 'Test body',
        idempotencyKey: IDEM_KEY,
        ...overrides,
    };
}

function makePrisma(createResult: { id: string } | 'UNIQUE_VIOLATION' | 'DB_ERROR') {
    const create = jest.fn();
    if (createResult === 'UNIQUE_VIOLATION') {
        const err = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
        create.mockRejectedValue(err);
    } else if (createResult === 'DB_ERROR') {
        create.mockRejectedValue(new Error('DB connection lost'));
    } else {
        create.mockResolvedValue(createResult);
    }
    return { notification: { create } };
}

function makeQueue() {
    return { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
}

describe('NotificationService', () => {
    it('정상 생성 → notification DB create + 큐 enqueue', async () => {
        const prisma = makePrisma({ id: NOTIFICATION_ID });
        const queue = makeQueue();
        const service = new NotificationService(prisma as never, queue as never);

        await service.createAndDispatch(makeParams());

        expect(prisma.notification.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: RECIPIENT_ID,
                    idempotencyKey: IDEM_KEY,
                }),
            }),
        );
        expect(queue.add).toHaveBeenCalledWith(
            'send-push',
            expect.objectContaining({ notificationId: NOTIFICATION_ID, recipientId: RECIPIENT_ID }),
            expect.objectContaining({
                attempts: 3,
                jobId: `notification:${IDEM_KEY}`,
            }),
        );
    });

    it('중복 idempotencyKey (P2002) → create/enqueue 모두 skip (멱등)', async () => {
        const prisma = makePrisma('UNIQUE_VIOLATION');
        const queue = makeQueue();
        const service = new NotificationService(prisma as never, queue as never);

        await expect(service.createAndDispatch(makeParams())).resolves.toBeUndefined();

        expect(queue.add).not.toHaveBeenCalled();
    });

    it('인앱 생성 DB 에러(비-P2002) → 예외 전파 없음 (정책 §2: 원 상태전이 보호) + enqueue 안 함', async () => {
        const prisma = makePrisma('DB_ERROR');
        const queue = makeQueue();
        const service = new NotificationService(prisma as never, queue as never);

        // side-effect 호출이므로 use-case를 실패시키면 안 됨 — 예외 전파 없이 resolve.
        await expect(service.createAndDispatch(makeParams())).resolves.toBeUndefined();
        expect(queue.add).not.toHaveBeenCalled();
    });

    it('큐 enqueue 실패 → 예외 전파 없음 (인앱 레코드 유지 폴백)', async () => {
        const prisma = makePrisma({ id: NOTIFICATION_ID });
        const queue = makeQueue();
        queue.add.mockRejectedValue(new Error('Redis down'));
        const service = new NotificationService(prisma as never, queue as never);

        // 예외가 전파되지 않아야 함
        await expect(service.createAndDispatch(makeParams())).resolves.toBeUndefined();
    });

    it('job enqueue jobId = notification:<idempotencyKey> (dedup)', async () => {
        const prisma = makePrisma({ id: NOTIFICATION_ID });
        const queue = makeQueue();
        const service = new NotificationService(prisma as never, queue as never);

        await service.createAndDispatch(makeParams());

        const callArgs = queue.add.mock.calls[0] as unknown[];
        const options = callArgs[2] as { jobId: string };
        expect(options.jobId).toBe(`notification:${IDEM_KEY}`);
    });

    it('backoff type=exponential, delay=2000', async () => {
        const prisma = makePrisma({ id: NOTIFICATION_ID });
        const queue = makeQueue();
        const service = new NotificationService(prisma as never, queue as never);

        await service.createAndDispatch(makeParams());

        const callArgs = queue.add.mock.calls[0] as unknown[];
        const options = callArgs[2] as { backoff: { type: string; delay: number } };
        expect(options.backoff.type).toBe('exponential');
        expect(options.backoff.delay).toBe(2000);
    });
});
