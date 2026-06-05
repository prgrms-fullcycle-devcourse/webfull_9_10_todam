import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PartnerGuard } from '../../common/guards/partner.guard';
import { CreateProgramUseCase } from './application/use-cases/create-program.use-case';
import { UpdateProgramUseCase } from './application/use-cases/update-program.use-case';
import { DeleteProgramImageUseCase } from './application/use-cases/delete-program-image.use-case';
import { GetProgramDetailUseCase } from './application/use-cases/get-program-detail.use-case';
import { GetPublicProgramDetailUseCase } from './application/use-cases/get-public-program-detail.use-case';
import { CreateProgramImageUseCase } from './application/use-cases/create-program-image.use-case';
import { UpdateProgramStatusUseCase } from './application/use-cases/update-program-status.use-case';
import { ConfirmProgramImageUseCase } from './application/use-cases/confirm-program-image.use-case';
import { ListPartnerStoreProgramsUseCase } from './application/use-cases/list-partner-store-programs.use-case';
import { ReorderPartnerStoreProgramsUseCase } from './application/use-cases/reorder-partner-store-programs.use-case';
import { ProgramRepository } from './domain/repositories/program.repository';
import { ProgramImageRepository } from './domain/repositories/program-image.repository';
import {
    PartnerProgramDetailReader,
    PartnerStoreProgramsReader,
    PublicProgramDetailReader,
} from './domain/repositories/program-readers';
import { PrismaProgramRepository } from './infrastructure/persistence/prisma-program.repository';
import { PrismaProgramImageRepository } from './infrastructure/persistence/prisma-program-image.repository';
import { PrismaPartnerProgramDetailReader } from './infrastructure/persistence/prisma-partner-program-detail.reader';
import { PrismaPublicProgramDetailReader } from './infrastructure/persistence/prisma-public-program-detail.reader';
import { PrismaPartnerStoreProgramsReader } from './infrastructure/persistence/prisma-partner-store-programs.reader';
import { ProgramController } from './presentation/controllers/program.controller';

@Module({
    imports: [AuthModule],
    controllers: [ProgramController],
    providers: [
        CreateProgramUseCase,
        UpdateProgramUseCase,
        DeleteProgramImageUseCase,
        GetProgramDetailUseCase,
        GetPublicProgramDetailUseCase,
        CreateProgramImageUseCase,
        UpdateProgramStatusUseCase,
        ConfirmProgramImageUseCase,
        ListPartnerStoreProgramsUseCase,
        ReorderPartnerStoreProgramsUseCase,
        { provide: ProgramRepository, useClass: PrismaProgramRepository },
        { provide: ProgramImageRepository, useClass: PrismaProgramImageRepository },
        { provide: PartnerProgramDetailReader, useClass: PrismaPartnerProgramDetailReader },
        { provide: PublicProgramDetailReader, useClass: PrismaPublicProgramDetailReader },
        { provide: PartnerStoreProgramsReader, useClass: PrismaPartnerStoreProgramsReader },
        PartnerGuard,
    ],
})
export class ProgramModule {}
