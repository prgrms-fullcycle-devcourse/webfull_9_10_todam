import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PartnerGuard } from '../../common/guards/partner.guard';
import { CancelPartnerReservationUseCase } from './application/use-cases/cancel-partner-reservation.use-case';
import { CompletePartnerReservationUseCase } from './application/use-cases/complete-partner-reservation.use-case';
import { ConfirmPartnerReservationUseCase } from './application/use-cases/confirm-partner-reservation.use-case';
import { CreatePartnerReservationUseCase } from './application/use-cases/create-partner-reservation.use-case';
import { GetPartnerReservationCalendarUseCase } from './application/use-cases/get-partner-reservation-calendar.use-case';
import { GetPartnerReservationDetailUseCase } from './application/use-cases/get-partner-reservation-detail.use-case';
import { ListPartnerReservationsUseCase } from './application/use-cases/list-partner-reservations.use-case';
import { RejectPartnerReservationUseCase } from './application/use-cases/reject-partner-reservation.use-case';
import { PartnerReservationRepository } from './domain/repositories/partner-reservation.repository';
import { PrismaPartnerReservationRepository } from './infrastructure/persistence/prisma-partner-reservation.repository';
import { PartnerReservationController } from './presentation/controllers/partner-reservation.controller';

@Module({
    imports: [AuthModule],
    controllers: [PartnerReservationController],
    providers: [
        GetPartnerReservationCalendarUseCase,
        ListPartnerReservationsUseCase,
        CreatePartnerReservationUseCase,
        GetPartnerReservationDetailUseCase,
        ConfirmPartnerReservationUseCase,
        RejectPartnerReservationUseCase,
        CancelPartnerReservationUseCase,
        CompletePartnerReservationUseCase,
        { provide: PartnerReservationRepository, useClass: PrismaPartnerReservationRepository },
        PartnerGuard,
    ],
})
export class ReservationModule {}
