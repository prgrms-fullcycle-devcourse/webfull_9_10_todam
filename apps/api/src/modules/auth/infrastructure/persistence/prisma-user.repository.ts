import { Injectable } from '@nestjs/common';
import {
    OAuthProvider as PrismaOAuthProvider,
    PolicyType as PrismaPolicyType,
    Prisma,
} from '@prisma/client';
import { PolicyType } from '@todam/shared';
import { PrismaService } from '../../../../database/prisma.service';
import { OAuthProvider, User } from '../../domain/entities/user.entity';
import {
    CreateOAuthUserInput,
    CreateUserInput,
    UserRepository,
} from '../../domain/repositories/user.repository';
import { UserMapper } from './user.mapper';

const USER_SELECT = {
    id: true,
    email: true,
    nickname: true,
    password: true,
    isPartner: true,
    emailVerified: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class PrismaUserRepository extends UserRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findById(id: string): Promise<User | null> {
        const row = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
        return row ? UserMapper.toDomain(row) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const row = await this.prisma.user.findUnique({ where: { email }, select: USER_SELECT });
        return row ? UserMapper.toDomain(row) : null;
    }

    async findByOAuth(provider: OAuthProvider, providerId: string): Promise<User | null> {
        const account = await this.prisma.oAuthAccount.findUnique({
            where: {
                provider_providerId: { provider: provider as PrismaOAuthProvider, providerId },
            },
            select: { user: { select: USER_SELECT } },
        });
        return account ? UserMapper.toDomain(account.user) : null;
    }

    async create(input: CreateUserInput): Promise<User> {
        const row = await this.prisma.user.create({
            data: {
                email: input.email,
                password: input.passwordHash,
                nickname: input.nickname,
                emailVerified: input.emailVerified,
            },
            select: USER_SELECT,
        });
        return UserMapper.toDomain(row);
    }

    async createWithConsents(
        input: CreateUserInput,
        agreedPolicyTypes: PolicyType[],
    ): Promise<User> {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: input.email,
                    password: input.passwordHash,
                    nickname: input.nickname,
                    emailVerified: input.emailVerified,
                },
                select: USER_SELECT,
            });

            for (const policyType of agreedPolicyTypes) {
                const version = await tx.policyVersion.findFirst({
                    where: { policyType: policyType as PrismaPolicyType, isLatest: true },
                    select: { id: true },
                });
                if (!version) {
                    // 시드 누락 = 서버 설정 오류. 트랜잭션 롤백 후 500.
                    throw new Error(`최신 약관 버전이 없습니다: ${policyType}`);
                }
                await tx.userConsent.create({
                    data: { userId: user.id, policyVersionId: version.id, isAgreed: true },
                });
            }

            return UserMapper.toDomain(user);
        });
    }

    async linkOAuth(userId: string, provider: OAuthProvider, providerId: string): Promise<void> {
        await this.prisma.oAuthAccount.create({
            data: { userId, provider: provider as PrismaOAuthProvider, providerId },
        });
    }

    async createWithOAuth(input: CreateOAuthUserInput): Promise<User> {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: input.email,
                    nickname: input.nickname,
                    password: null,
                    emailVerified: true,
                },
                select: USER_SELECT,
            });
            await tx.oAuthAccount.create({
                data: {
                    userId: user.id,
                    provider: input.provider as PrismaOAuthProvider,
                    providerId: input.providerId,
                },
            });
            return UserMapper.toDomain(user);
        });
    }

    async updatePasswordAndRevokeTokens(userId: string, passwordHash: string): Promise<void> {
        await this.prisma.$transaction([
            this.prisma.user.update({ where: { id: userId }, data: { password: passwordHash } }),
            this.prisma.refreshToken.deleteMany({ where: { userId } }),
        ]);
    }
}
