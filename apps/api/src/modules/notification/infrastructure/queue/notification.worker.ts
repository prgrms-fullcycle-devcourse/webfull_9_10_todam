import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationDeliveryStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { FcmService } from '../fcm/fcm.service';
import type { NotificationJobPayload } from './notification-job.type';

export const NOTIFICATION_QUEUE = 'notification';

/**
 * BullMQ 워커 — 'notification' 큐 소비.
 *
 * 처리 흐름:
 *  1. NotificationSetting.webPushEnabled 확인 → false면 WEB_PUSH skip (인앱 레코드는 이미 존재).
 *  2. 수신자 활성 토큰(revokedAt=null) 목록 조회.
 *  3. (notificationId, WEB_PUSH) 채널 delivery 레코드 1개 find-or-create.
 *  4. 각 토큰마다 FCM 발송 시도, 결과 집계(하나라도 성공 시 SENT).
 *  5. 무효 토큰(InvalidToken=true) → revokedAt=now() 처리.
 *  6. delivery 갱신: status(SENT/FAILED), attempts=재시도횟수, sentAt/failedReason.
 *
 * 재시도 정책: job options `attempts:3` + 지수 backoff (BullMQ default).
 * NotificationDelivery는 (notificationId, WEB_PUSH)당 **1레코드**이며, 재시도마다
 * `attempts`(=job.attemptsMade+1)가 증가하고 status가 최신 결과로 갱신된다(중복 레코드 생성 안 함).
 */
@Processor(NOTIFICATION_QUEUE)
export class NotificationWorker extends WorkerHost {
    private readonly logger = new Logger(NotificationWorker.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly fcm: FcmService,
    ) {
        super();
    }

    async process(job: Job<NotificationJobPayload>): Promise<void> {
        const { notificationId, recipientId, title, body, deepLink } = job.data;
        // BullMQ가 추적하는 시도 횟수(첫 실행 0) +1 = 총 시도 횟수.
        const attempts = (job.attemptsMade ?? 0) + 1;

        this.logger.debug(
            `Processing notification job id=${job.id} notificationId=${notificationId} recipientId=${recipientId} attempt=${attempts}`,
        );

        // 1. webPushEnabled 확인
        const setting = await this.prisma.notificationSetting.findUnique({
            where: { userId: recipientId },
            select: { webPushEnabled: true },
        });

        // 레코드 없으면 기본값 true(lazy-default 정책) 적용.
        const webPushEnabled = setting?.webPushEnabled ?? true;
        if (!webPushEnabled) {
            this.logger.debug(
                `webPushEnabled=false — WEB_PUSH skipped for notificationId=${notificationId}`,
            );
            return;
        }

        // 2. 활성 FCM 토큰 조회
        const tokens = await this.prisma.notificationToken.findMany({
            where: { userId: recipientId, revokedAt: null },
            select: { id: true, fcmToken: true },
        });

        if (tokens.length === 0) {
            this.logger.debug(
                `No active FCM tokens for recipientId=${recipientId} — skipping WEB_PUSH.`,
            );
            return;
        }

        // 3. (notificationId, WEB_PUSH) delivery 레코드 1개 find-or-create.
        //    재시도 시 새로 만들지 않고 기존 레코드를 갱신한다.
        const existing = await this.prisma.notificationDelivery.findFirst({
            where: { notificationId, channel: 'WEB_PUSH' },
            select: { id: true },
        });
        const deliveryId = existing
            ? existing.id
            : (
                  await this.prisma.notificationDelivery.create({
                      data: {
                          notificationId,
                          channel: 'WEB_PUSH',
                          status: NotificationDeliveryStatus.PENDING,
                          attempts,
                      },
                      select: { id: true },
                  })
              ).id;

        // 4-5. 각 토큰에 발송 + 결과 집계 + 무효 토큰 revoke.
        let anySuccess = false;
        const failedReasons: string[] = [];
        for (const tokenRow of tokens) {
            const result = await this.fcm.sendToToken(tokenRow.fcmToken, {
                title,
                body,
                deepLink,
            });

            if (result.success) {
                anySuccess = true;
                this.logger.log(
                    `FCM sent — notificationId=${notificationId} token=${tokenRow.fcmToken.slice(0, 20)}...`,
                );
            } else {
                failedReasons.push(result.reason);
                this.logger.warn(
                    `FCM failed — notificationId=${notificationId} reason=${result.reason} invalidToken=${result.invalidToken}`,
                );
                if (result.invalidToken) {
                    await this.prisma.notificationToken.update({
                        where: { id: tokenRow.id },
                        data: { revokedAt: new Date() },
                    });
                    this.logger.warn(`FCM token revoked (invalid) — tokenId=${tokenRow.id}`);
                }
            }
        }

        // 6. delivery 갱신 — 하나라도 성공하면 SENT, 전부 실패면 FAILED.
        await this.prisma.notificationDelivery.update({
            where: { id: deliveryId },
            data: anySuccess
                ? {
                      status: NotificationDeliveryStatus.SENT,
                      attempts,
                      sentAt: new Date(),
                      failedReason: null,
                  }
                : {
                      status: NotificationDeliveryStatus.FAILED,
                      attempts,
                      failedReason: failedReasons.join('; ') || 'unknown',
                  },
        });
    }
}
