/// <reference types="jest" />

// firebase-admin v14 named export mock
const mockSend = jest.fn();
const mockGetMessaging = jest.fn(() => ({ send: mockSend }));
const mockApps: unknown[] = [];
const mockInitializeApp = jest.fn(() => {
    mockApps.push({});
});
const mockGetApps = jest.fn(() => mockApps);
const mockCert = jest.fn((sa: unknown) => sa);

jest.mock('firebase-admin/app', () => ({
    initializeApp: mockInitializeApp,
    getApps: mockGetApps,
    cert: mockCert,
}));

jest.mock('firebase-admin/messaging', () => ({
    getMessaging: mockGetMessaging,
}));

import { FcmService } from './fcm.service';

const VALID_SA = Buffer.from(
    JSON.stringify({ type: 'service_account', project_id: 'test' }),
).toString('base64');

describe('FcmService', () => {
    let service: FcmService;

    beforeEach(() => {
        service = new FcmService();
        mockApps.length = 0;
        mockInitializeApp.mockClear();
        mockGetApps.mockImplementation(() => mockApps);
        mockSend.mockReset();
        mockGetMessaging.mockReturnValue({ send: mockSend });
    });

    describe('onModuleInit', () => {
        it('FIREBASE_SERVICE_ACCOUNT_BASE64 없으면 init skip, isInitialized=false', () => {
            delete process.env['FIREBASE_SERVICE_ACCOUNT_BASE64'];
            service.onModuleInit();
            expect(service.isInitialized).toBe(false);
            expect(mockInitializeApp).not.toHaveBeenCalled();
        });

        it('유효한 base64 서비스 계정 → initializeApp 호출, isInitialized=true', () => {
            process.env['FIREBASE_SERVICE_ACCOUNT_BASE64'] = VALID_SA;
            service.onModuleInit();
            expect(mockInitializeApp).toHaveBeenCalledTimes(1);
            expect(service.isInitialized).toBe(true);
            delete process.env['FIREBASE_SERVICE_ACCOUNT_BASE64'];
        });

        it('이미 app이 있으면(getApps().length>0) initializeApp 재호출 안 함', () => {
            process.env['FIREBASE_SERVICE_ACCOUNT_BASE64'] = VALID_SA;
            mockApps.push({}); // 이미 초기화된 앱 시뮬레이션
            service.onModuleInit();
            expect(mockInitializeApp).not.toHaveBeenCalled();
            delete process.env['FIREBASE_SERVICE_ACCOUNT_BASE64'];
        });
    });

    describe('sendToToken', () => {
        it('FCM 미초기화 → success:false, invalidToken:false (no-op)', async () => {
            delete process.env['FIREBASE_SERVICE_ACCOUNT_BASE64'];
            service.onModuleInit();
            const result = await service.sendToToken('tok', { title: 'T', body: 'B' });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.invalidToken).toBe(false);
            }
        });

        it('성공 발송 → success:true + messageId', async () => {
            process.env['FIREBASE_SERVICE_ACCOUNT_BASE64'] = VALID_SA;
            service.onModuleInit();
            mockSend.mockResolvedValue('projects/test/messages/abc123');

            const result = await service.sendToToken('token-xyz', {
                title: 'T',
                body: 'B',
                deepLink: '/foo',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.messageId).toBe('projects/test/messages/abc123');
            }
            delete process.env['FIREBASE_SERVICE_ACCOUNT_BASE64'];
        });

        it('무효 토큰 에러 → success:false, invalidToken:true', async () => {
            process.env['FIREBASE_SERVICE_ACCOUNT_BASE64'] = VALID_SA;
            service.onModuleInit();
            const err = Object.assign(new Error('invalid token'), {
                code: 'messaging/registration-token-not-registered',
            });
            mockSend.mockRejectedValue(err);

            const result = await service.sendToToken('bad-token', { title: 'T', body: 'B' });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.invalidToken).toBe(true);
            }
            delete process.env['FIREBASE_SERVICE_ACCOUNT_BASE64'];
        });

        it('일반 에러 → success:false, invalidToken:false', async () => {
            process.env['FIREBASE_SERVICE_ACCOUNT_BASE64'] = VALID_SA;
            service.onModuleInit();
            const err = Object.assign(new Error('network error'), {
                code: 'messaging/internal-error',
            });
            mockSend.mockRejectedValue(err);

            const result = await service.sendToToken('token-err', { title: 'T', body: 'B' });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.invalidToken).toBe(false);
            }
            delete process.env['FIREBASE_SERVICE_ACCOUNT_BASE64'];
        });
    });
});
