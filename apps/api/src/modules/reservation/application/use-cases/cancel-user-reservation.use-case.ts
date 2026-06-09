import { HttpStatus, Injectable } from '@nestjs/common';
import { ReservationSource, ReservationStatus } from '@prisma/client';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { isCancellationDeadlineExceeded } from '../../domain/cancellation-policy';
import { UserReservationRepository } from '../../domain/repositories/user-reservation.repository';
import type { CancelReservationResponseDto } from '../../presentation/dto/user-reservation.dto';

@Injectable()
export class CancelUserReservationUseCase {
    constructor(private readonly reservations: UserReservationRepository) {}

    async execute(
        currentUserId: string,
        reservationId: string,
    ): Promise<CancelReservationResponseDto> {
        // 1. 예약 조회
        const row = await this.reservations.findForCancel(reservationId);

        if (!row) {
            throw new BusinessException(
                'RESERVATION_NOT_FOUND',
                '예약을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 2. 본인 가드 — userId=null(PARTNER_MANUAL source) 포함 모두 403
        if (row.userId !== currentUserId) {
            throw new BusinessException(
                'FORBIDDEN',
                '해당 예약에 대한 접근 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // 3. 에러 분기 (순서 주의: ALREADY_CANCELED → INVALID_RESERVATION_STATUS → DEADLINE)
        if (row.status === ReservationStatus.CANCELED) {
            throw new BusinessException(
                'ALREADY_CANCELED',
                '이미 취소된 예약입니다.',
                HttpStatus.CONFLICT,
            );
        }

        if (
            (row.status !== ReservationStatus.PENDING &&
                row.status !== ReservationStatus.CONFIRMED) ||
            row.source !== ReservationSource.CUSTOMER
        ) {
            throw new BusinessException(
                'INVALID_RESERVATION_STATUS',
                '취소할 수 없는 상태의 예약입니다.',
                HttpStatus.CONFLICT,
            );
        }

        if (isCancellationDeadlineExceeded(row.scheduledAt, row.cancelDeadlineDays)) {
            throw new BusinessException(
                'CANCELLATION_DEADLINE_EXCEEDED',
                '취소 가능 시간이 초과되었습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        // 4. 트랜잭션 취소 처리
        const result = await this.reservations.cancelReservation(row, currentUserId);

        // canceledBy는 userId(비어있지 않음), cancelReason은 항상 null(바디 없는 취소),
        // canceledAt은 트랜잭션 내에서 new Date()로 항상 설정됨.
        return {
            reservation: {
                id: result.id,
                status: result.status,
                canceledBy: result.canceledBy as string,
                cancelReason: result.cancelReason as null,
                canceledAt: result.canceledAt!.toISOString(),
            },
        };
    }
}
