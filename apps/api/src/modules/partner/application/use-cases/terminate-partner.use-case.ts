import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PartnerTerminationErrorCode } from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { PartnerTerminationRepository } from '../../domain/repositories/partner-termination.repository';

@Injectable()
export class TerminatePartnerUseCase {
    private readonly logger = new Logger(TerminatePartnerUseCase.name);

    constructor(private readonly partners: PartnerTerminationRepository) {}

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
        return null;
    }
}
