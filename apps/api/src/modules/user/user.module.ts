import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GetMyProfileUseCase } from './application/use-cases/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from './application/use-cases/update-my-profile.use-case';
import { WithdrawUseCase } from './application/use-cases/withdraw.use-case';
import { UserRepository } from './domain/repositories/user.repository';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { UserController } from './presentation/controllers/user.controller';

@Module({
    imports: [AuthModule],
    controllers: [UserController],
    providers: [
        GetMyProfileUseCase,
        UpdateMyProfileUseCase,
        WithdrawUseCase,
        { provide: UserRepository, useClass: PrismaUserRepository },
    ],
})
export class UserModule {}
