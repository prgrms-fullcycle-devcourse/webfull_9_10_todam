import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PartnerGuard } from '../../common/guards/partner.guard';
import { GenerateTimeSlotsUseCase } from './application/use-cases/generate-time-slots.use-case';
import { ListTimeSlotsUseCase } from './application/use-cases/list-time-slots.use-case';
import { UpdateTimeSlotStatusUseCase } from './application/use-cases/update-time-slot-status.use-case';
import { CreateReservationRestrictionsUseCase } from './application/use-cases/create-reservation-restrictions.use-case';
import { DeleteReservationRestrictionsUseCase } from './application/use-cases/delete-reservation-restrictions.use-case';
import { GetProgramReservationCountsUseCase } from './application/use-cases/get-program-reservation-counts.use-case';
import { GetProgramAvailableSlotsUseCase } from './application/use-cases/get-program-available-slots.use-case';
import { StoreTimeSlotRepository } from './domain/repositories/store-time-slot.repository';
import { ReservationRestrictionRepository } from './domain/repositories/reservation-restriction.repository';
import { TimeslotSupportReader } from './domain/repositories/timeslot-support.reader';
import { PrismaStoreTimeSlotRepository } from './infrastructure/persistence/prisma-store-time-slot.repository';
import { PrismaReservationRestrictionRepository } from './infrastructure/persistence/prisma-reservation-restriction.repository';
import { PrismaTimeslotSupportReader } from './infrastructure/persistence/prisma-timeslot-support.reader';
import { TimeslotController } from './presentation/controllers/timeslot.controller';

@Module({
    imports: [AuthModule],
    controllers: [TimeslotController],
    providers: [
        GenerateTimeSlotsUseCase,
        ListTimeSlotsUseCase,
        UpdateTimeSlotStatusUseCase,
        CreateReservationRestrictionsUseCase,
        DeleteReservationRestrictionsUseCase,
        GetProgramReservationCountsUseCase,
        GetProgramAvailableSlotsUseCase,
        // 포트 → Prisma 어댑터 바인딩(추상 클래스 토큰).
        { provide: StoreTimeSlotRepository, useClass: PrismaStoreTimeSlotRepository },
        {
            provide: ReservationRestrictionRepository,
            useClass: PrismaReservationRestrictionRepository,
        },
        { provide: TimeslotSupportReader, useClass: PrismaTimeslotSupportReader },
        PartnerGuard,
    ],
})
export class TimeslotModule {}
