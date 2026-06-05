import { Injectable } from '@nestjs/common';
import { calcDisplayState } from '../../domain/display-state.util';
import { UserReservationRepository } from '../../domain/repositories/user-reservation.repository';
import type {
    CreateUserReservationDto,
    CreateUserReservationResponseDto,
} from '../../presentation/dto/user-reservation.dto';

@Injectable()
export class CreateUserReservationUseCase {
    constructor(private readonly reservations: UserReservationRepository) {}

    async execute(
        userId: string,
        dto: CreateUserReservationDto,
    ): Promise<CreateUserReservationResponseDto> {
        const result = await this.reservations.createCustomer(userId, {
            programId: dto.programId,
            slotId: dto.slotId,
            reserverName: dto.reserverName,
            reserverPhone: dto.reserverPhone,
            participantCount: dto.participantCount,
            deliveryMethod: dto.deliveryMethod,
            requestMemo: dto.requestMemo,
        });

        const { reservation } = result;
        const displayState = calcDisplayState(reservation.status);

        return {
            reservation: {
                id: reservation.id,
                programId: reservation.programId,
                slotId: reservation.storeTimeSlotId,
                reserverName: reservation.reserverName,
                participantCount: reservation.participantCount,
                status: reservation.status,
                displayState,
                createdAt: reservation.createdAt.toISOString(),
            },
        };
    }
}
