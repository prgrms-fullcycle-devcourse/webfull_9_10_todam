import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { NotificationCategory } from '@prisma/client';
import { PartnerTerminationErrorCode } from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { NotificationService } from '../../../notification/application/services/notification.service';
import { PartnerTerminationRepository } from '../../domain/repositories/partner-termination.repository';

@Injectable()
export class TerminatePartnerUseCase {
    private readonly logger = new Logger(TerminatePartnerUseCase.name);

    constructor(
        private readonly partners: PartnerTerminationRepository,
        private readonly notificationService: NotificationService,
    ) {}

    async execute(userId: string): Promise<null> {
        const result = await this.partners.terminate(userId);

        if (result.outcome === 'NOT_FOUND') {
            this.logger.warn(`[partner-termination-rejected] userId=${userId} reason=NOT_FOUND`);
            throw new BusinessException(
                PartnerTerminationErrorCode.PARTNER_NOT_FOUND,
                '해지 가능한 파트너를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        if (result.outcome === 'BLOCKED') {
            this.logger.warn(
                `[partner-termination-rejected] userId=${userId} partnerId=${result.partnerId} reason=${result.reason}`,
            );
            throw new BusinessException(
                PartnerTerminationErrorCode.ACTIVE_RESERVATIONS_OR_ARTWORKS_EXIST,
                '진행 중인 예약 또는 작품이 있어 파트너 자격을 해지할 수 없습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        this.logger.log(
            `[partner-terminated] userId=${userId} partnerId=${result.partnerId} terminatedAt=${result.terminatedAt.toISOString()}`,
        );

        // P-9: Partner→TERMINATED 시 파트너에게 알림 (plan §5 P-9, 정책 §5.3)
        // userId = 파트너 User id (terminate 인자 그대로 사용)
        // 트랜잭션 커밋 이후 side-effect — 발송 실패가 상태 전이 롤백 유발 금지 (plan §2)
        await this.notificationService.createAndDispatch({
            recipientId: userId,
            eventType: 'P-9',
            category: NotificationCategory.OPERATION,
            title: '파트너 자격 변경',
            body: '파트너 자격 상태가 변경됐어요.',
            deepLink: `/partner`,
            idempotencyKey: `P-9:${result.partnerId}:${userId}`,
        });

        return null;
    }
}
