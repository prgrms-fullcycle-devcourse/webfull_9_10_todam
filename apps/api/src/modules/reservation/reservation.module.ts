import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PartnerGuard } from '../../common/guards/partner.guard';
import { CancelPartnerReservationUseCase } from './application/use-cases/cancel-partner-reservation.use-case';
import { CancelUserReservationUseCase } from './application/use-cases/cancel-user-reservation.use-case';
import { CompletePartnerReservationUseCase } from './application/use-cases/complete-partner-reservation.use-case';
import { ConfirmPartnerReservationUseCase } from './application/use-cases/confirm-partner-reservation.use-case';
import { CreatePartnerReservationUseCase } from './application/use-cases/create-partner-reservation.use-case';
import { CreateUserReservationUseCase } from './application/use-cases/create-user-reservation.use-case';
import { GetReservationDetailUseCase } from './application/use-cases/get-reservation-detail.use-case';
import { ListUserReservationsUseCase } from './application/use-cases/list-user-reservations.use-case';
import { GetPartnerReservationCalendarUseCase } from './application/use-cases/get-partner-reservation-calendar.use-case';
import { GetPartnerReservationDetailUseCase } from './application/use-cases/get-partner-reservation-detail.use-case';
import { GetPendingReservationSummaryUseCase } from './application/use-cases/get-pending-reservation-summary.use-case';
import { ListPartnerReservationsUseCase } from './application/use-cases/list-partner-reservations.use-case';
import { RejectPartnerReservationUseCase } from './application/use-cases/reject-partner-reservation.use-case';
import { UpdatePartnerReservationInternalMemoUseCase } from './application/use-cases/update-partner-reservation-internal-memo.use-case';
import { PartnerReservationRepository } from './domain/repositories/partner-reservation.repository';
import { UserReservationRepository } from './domain/repositories/user-reservation.repository';
import { PrismaPartnerReservationRepository } from './infrastructure/persistence/prisma-partner-reservation.repository';
import { PrismaUserReservationRepository } from './infrastructure/persistence/prisma-user-reservation.repository';
import { PartnerReservationController } from './presentation/controllers/partner-reservation.controller';
import { UserReservationController } from './presentation/controllers/user-reservation.controller';

@Module({
    imports: [AuthModule],
    controllers: [PartnerReservationController, UserReservationController],
    providers: [
        GetPartnerReservationCalendarUseCase,
        ListPartnerReservationsUseCase,
        CreatePartnerReservationUseCase,
        CreateUserReservationUseCase,
        GetReservationDetailUseCase,
        ListUserReservationsUseCase,
        GetPartnerReservationDetailUseCase,
        GetPendingReservationSummaryUseCase,
        ConfirmPartnerReservationUseCase,
        RejectPartnerReservationUseCase,
        CancelPartnerReservationUseCase,
        CancelUserReservationUseCase,
        CompletePartnerReservationUseCase,
        UpdatePartnerReservationInternalMemoUseCase,
        { provide: PartnerReservationRepository, useClass: PrismaPartnerReservationRepository },
        { provide: UserReservationRepository, useClass: PrismaUserReservationRepository },
        PartnerGuard,
    ],
})
export class ReservationModule {}
