import { HttpStatus, Injectable } from '@nestjs/common';
import { StoreStatus } from '@prisma/client';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { PartnerReservationRepository } from '../../domain/repositories/partner-reservation.repository';
import type {
    CreatePartnerReservationDto,
    CreatePartnerReservationResponseDto,
} from '../../presentation/dto/partner-reservation.dto';

@Injectable()
export class CreatePartnerReservationUseCase {
    constructor(
        private readonly reservations: PartnerReservationRepository,
        private readonly ownership: StoreOwnershipService,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        dto: CreatePartnerReservationDto,
    ): Promise<CreatePartnerReservationResponseDto> {
        const store = await this.ownership.verify(userId, storeId);
        if (store.status !== StoreStatus.PUBLISHED) {
            throw new BusinessException(
                'STORE_NOT_PUBLISHED',
                'Published stores only can create manual reservations.',
                HttpStatus.FORBIDDEN,
            );
        }

        const result = await this.reservations.createManual(storeId, {
            ...dto,
            changedBy: userId,
        });
        if (!result) {
            throw new BusinessException(
                'RESOURCE_NOT_FOUND',
                'Program or slot was not found.',
                HttpStatus.NOT_FOUND,
            );
        }

        return {
            reservation: {
                id: result.reservation.id,
                reserverName: result.reservation.reserverName,
                status: result.reservation.status,
                source: result.reservation.source,
                artworkId: result.artwork.id,
                createdAt: result.reservation.createdAt.toISOString(),
            },
        };
    }
}
