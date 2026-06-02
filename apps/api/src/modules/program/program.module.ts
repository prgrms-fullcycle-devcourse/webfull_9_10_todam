import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PartnerGuard } from '../../common/guards/partner.guard';
import { CreateProgramUseCase } from './application/use-cases/create-program.use-case';
import { CreateProgramImageUseCase } from './application/use-cases/create-program-image.use-case';
import { UpdateProgramStatusUseCase } from './application/use-cases/update-program-status.use-case';
import { ConfirmProgramImageUseCase } from './application/use-cases/confirm-program-image.use-case';
import { ProgramController } from './presentation/controllers/program.controller';

@Module({
    imports: [AuthModule],
    controllers: [ProgramController],
    providers: [
        CreateProgramUseCase,
        CreateProgramImageUseCase,
        UpdateProgramStatusUseCase,
        ConfirmProgramImageUseCase,
        PartnerGuard,
    ],
})
export class ProgramModule {}
