import { Module } from '@nestjs/common';
import { GetLatestPoliciesUseCase } from './application/use-cases/get-latest-policies.use-case';
import { PolicyVersionRepository } from './domain/repositories/policy-version.repository';
import { PrismaPolicyVersionRepository } from './infrastructure/persistence/prisma-policy-version.repository';
import { PolicyController } from './presentation/controllers/policy.controller';

// GET /policies/latest — PUBLIC (AuthGuard 미적용. 가입 전 호출).
// DatabaseModule 은 @Global() 이므로 PrismaService 별도 import 불필요.
@Module({
    controllers: [PolicyController],
    providers: [
        GetLatestPoliciesUseCase,
        { provide: PolicyVersionRepository, useClass: PrismaPolicyVersionRepository },
    ],
})
export class PolicyModule {}
