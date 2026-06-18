import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { initializeApp, getApps } from 'firebase-admin/app';
import { cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import type { ServiceAccount } from 'firebase-admin/app';
import type { Message } from 'firebase-admin/messaging';

/**
 * Firebase Admin SDK 래퍼 서비스.
 *
 * 초기화:
 *  - FIREBASE_SERVICE_ACCOUNT_BASE64 환경변수를 base64 디코딩 → JSON.parse → cert() 로 초기화.
 *  - 환경변수 없으면 init skip + 경고 로그(인앱 레코드는 유지되므로 폴백 정책 준수).
 *
 * sendToToken 반환 타입:
 *  - { success: true; messageId: string }
 *  - { success: false; invalidToken: boolean; reason: string }
 *   → invalidToken=true 이면 호출측이 토큰 revoke 판단.
 */
@Injectable()
export class FcmService implements OnModuleInit {
    private readonly logger = new Logger(FcmService.name);
    private initialized = false;

    // firebase-admin이 제공하는 무효 토큰 에러 코드 목록.
    private static readonly INVALID_TOKEN_CODES = new Set([
        'messaging/registration-token-not-registered',
        'messaging/invalid-registration-token',
        'messaging/invalid-argument',
    ]);

    onModuleInit(): void {
        const b64 = process.env['FIREBASE_SERVICE_ACCOUNT_BASE64'];
        if (!b64) {
            this.logger.warn(
                'FIREBASE_SERVICE_ACCOUNT_BASE64 not set — FCM send will be skipped (no-op). 인앱 알림 레코드는 정상 생성됩니다.',
            );
            return;
        }

        try {
            const json = Buffer.from(b64, 'base64').toString('utf-8');
            const serviceAccount = JSON.parse(json) as ServiceAccount;

            // 이미 초기화된 app이 있으면 재사용 (hot-reload 중복 방지).
            if (getApps().length === 0) {
                initializeApp({
                    credential: cert(serviceAccount),
                });
            }
            this.initialized = true;
            this.logger.log('Firebase Admin SDK initialized.');
        } catch (err) {
            this.logger.error('Firebase Admin SDK 초기화 실패. FCM 발송이 비활성화됩니다.', err);
        }
    }

    get isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * 단일 FCM 토큰으로 메시지 발송.
     *
     * @param token FCM 등록 토큰
     * @param payload 알림 페이로드
     */
    async sendToToken(
        token: string,
        payload: { title: string; body: string; deepLink?: string },
    ): Promise<
        | { success: true; messageId: string }
        | { success: false; invalidToken: boolean; reason: string }
    > {
        if (!this.initialized) {
            this.logger.debug('FCM not initialized — skipping send (no-op).');
            return { success: false, invalidToken: false, reason: 'FCM not initialized' };
        }

        try {
            // data-only 페이로드로 발송한다.
            // notification 블록을 함께 보내면 웹에서 FCM SDK가 알림을 자동 표시하고,
            // SW(firebase-messaging-sw.js)의 onBackgroundMessage가 또 표시해 알림이 2번 뜬다.
            // data만 보내면 표시는 전적으로 SW가 1회 담당한다(클릭 deepLink도 SW가 처리).
            // 주의: FCM data 값은 모두 문자열이어야 한다.
            const message: Message = {
                token,
                data: {
                    title: payload.title,
                    body: payload.body,
                    ...(payload.deepLink ? { deepLink: payload.deepLink } : {}),
                },
            };

            const messageId = await getMessaging().send(message);
            return { success: true, messageId };
        } catch (err: unknown) {
            const code = this.extractErrorCode(err);
            const invalidToken = FcmService.INVALID_TOKEN_CODES.has(code);
            const reason = code || String(err);
            this.logger.warn(`FCM send failed — token=${token.slice(0, 20)}... code=${code}`);
            return { success: false, invalidToken, reason };
        }
    }

    private extractErrorCode(err: unknown): string {
        if (
            err !== null &&
            typeof err === 'object' &&
            'code' in err &&
            typeof (err as Record<string, unknown>)['code'] === 'string'
        ) {
            return (err as Record<string, unknown>)['code'] as string;
        }
        return '';
    }
}
