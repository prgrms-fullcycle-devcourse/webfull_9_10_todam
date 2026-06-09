import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TerminatePartnerUseCase } from './application/use-cases/terminate-partner.use-case';
import { PartnerTerminationRepository } from './domain/repositories/partner-termination.repository';
import { PrismaPartnerTerminationRepository } from './infrastructure/persistence/prisma-partner-termination.repository';
import { PartnerController } from './presentation/controllers/partner.controller';

@Module({
    imports: [AuthModule],
    controllers: [PartnerController],
    providers: [
        TerminatePartnerUseCase,
        { provide: PartnerTerminationRepository, useClass: PrismaPartnerTerminationRepository },
    ],
})
export class PartnerModule {}
