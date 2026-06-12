import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationCategory } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { NOTIFICATION_QUEUE } from '../../infrastructure/queue/notification.worker';
import type { NotificationJobPayload } from '../../infrastructure/queue/notification-job.type';

export interface CreateAndDispatchParams {
    recipientId: string;
    eventType: string;
    category: NotificationCategory;
    title: string;
    body: string;
    deepLink?: string;
    idempotencyKey: string;
    /** 내부용 FK (optional) */
    artworkId?: string;
    reservationId?: string;
}

/**
 * NotificationService — 인앱 알림 생성 + FCM 발송 큐 enqueue를 통합.
 *
 * createAndDispatch:
 *  1. Notification DB 레코드 생성 (idempotencyKey unique 충돌 시 skip — 멱등).
 *  2. 생성됐을 때만 'notification' 큐에 job enqueue.
 *
 * 트랜잭션 경계: 알림 생성은 원 비즈니스 트랜잭션 커밋 이후에 호출해야 함(side-effect).
 * 발송 실패가 원 트랜잭션을 롤백시키면 안 됨 — plan §정책 §2.
 */
@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue(NOTIFICATION_QUEUE) private readonly queue: Queue<NotificationJobPayload>,
    ) {}

    async createAndDispatch(params: CreateAndDispatchParams): Promise<void> {
        const {
            recipientId,
            eventType,
            category,
            title,
            body,
            deepLink,
            idempotencyKey,
            artworkId,
            reservationId,
        } = params;

        // 1. 인앱 Notification 생성 (idempotencyKey unique 충돌 → skip)
        let notificationId: string | null = null;
        try {
            const created = await this.prisma.notification.create({
                data: {
                    userId: recipientId,
                    eventType,
                    category,
                    title,
                    body,
                    deepLink,
                    idempotencyKey,
                    ...(artworkId ? { artworkId } : {}),
                    ...(reservationId ? { reservationId } : {}),
                },
                select: { id: true },
            });
            notificationId = created.id;
        } catch (err: unknown) {
            // Prisma unique constraint 위반 코드(P2002) → 이미 처리된 알림, skip.
            if (this.isPrismaUniqueError(err)) {
                this.logger.debug(
                    `createAndDispatch skipped — duplicate idempotencyKey=${idempotencyKey}`,
                );
                return;
            }
            // 인앱 알림 생성 실패도 원 비즈니스 결과(상태전이)를 덮어쓰면 안 됨(정책 §2: 발송 실패는
            // 원 상태에 영향 없음). side-effect로 호출되므로 에러를 삼키고 로깅만 한다.
            this.logger.error(
                `createAndDispatch failed to create notification — idempotencyKey=${idempotencyKey}`,
                err,
            );
            return;
        }

        // 2. 발송 job enqueue
        try {
            await this.queue.add(
                'send-push',
                {
                    notificationId,
                    recipientId,
                    title,
                    body,
                    deepLink,
                },
                {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                    // job dedup: idempotencyKey를 jobId로 사용 → 동일 알림 2회 enqueue 시 1회만 처리.
                    jobId: `notification:${idempotencyKey}`,
                    removeOnComplete: 100,
                    removeOnFail: 50,
                },
            );
            this.logger.debug(
                `Notification job enqueued — notificationId=${notificationId} idempotencyKey=${idempotencyKey}`,
            );
        } catch (err) {
            // 큐 enqueue 실패는 인앱 레코드를 롤백시키지 않는다 (폴백 정책).
            this.logger.error(
                `Failed to enqueue notification job — notificationId=${notificationId}`,
                err,
            );
        }
    }

    private isPrismaUniqueError(err: unknown): boolean {
        return (
            err !== null &&
            typeof err === 'object' &&
            'code' in err &&
            (err as Record<string, unknown>)['code'] === 'P2002'
        );
    }
}
