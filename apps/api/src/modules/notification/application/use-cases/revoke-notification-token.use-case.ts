import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { NotificationTokenRepository } from '../../domain/repositories/notification-token.repository';

@Injectable()
export class RevokeNotificationTokenUseCase {
    constructor(private readonly tokens: NotificationTokenRepository) {}

    async execute(params: { userId: string; fcmToken: string }): Promise<void> {
        const result = await this.tokens.revoke({
            userId: params.userId,
            fcmToken: params.fcmToken,
        });

        // 본인 소유 토큰이 아니거나 존재하지 않으면 404.
        // (userId 일치 검증은 repository에서 userId+fcmToken 조합으로 처리됨)
        if (!result) {
            throw new BusinessException(
                'NOTIFICATION_TOKEN_NOT_FOUND',
                '해당 알림 토큰을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }
    }
}
