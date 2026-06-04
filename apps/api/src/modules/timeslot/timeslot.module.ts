import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PartnerGuard } from '../../common/guards/partner.guard';
import { GenerateTimeSlotsUseCase } from './application/use-cases/generate-time-slots.use-case';
import { ListTimeSlotsUseCase } from './application/use-cases/list-time-slots.use-case';
import { UpdateTimeSlotStatusUseCase } from './application/use-cases/update-time-slot-status.use-case';
import { CreateReservationRestrictionsUseCase } from './application/use-cases/create-reservation-restrictions.use-case';
import { DeleteReservationRestrictionsUseCase } from './application/use-cases/delete-reservation-restrictions.use-case';
import { GetProgramReservationCountsUseCase } from './application/use-cases/get-program-reservation-counts.use-case';
import { StoreAccessService } from './application/services/store-access.service';
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
        StoreAccessService,
        PartnerGuard,
    ],
})
export class TimeslotModule {}
