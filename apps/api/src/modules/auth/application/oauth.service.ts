import { Injectable } from '@nestjs/common';
import type { LoginUser } from '@todam/shared';
import { OAuthProvider, User } from '../domain/entities/user.entity';
import { UserRepository } from '../domain/repositories/user.repository';

@Injectable()
export class OAuthService {
    constructor(private readonly users: UserRepository) {}

    async findOrCreateUser(
        provider: OAuthProvider,
        providerId: string,
        email: string,
        nickname: string,
    ): Promise<LoginUser> {
        // 1. 이미 연동된 OAuthAccount가 있으면 그 유저 사용
        const linked = await this.users.findByOAuth(provider, providerId);
        if (linked) return this.toDto(linked);

        // 2. 동일 이메일로 가입된 유저가 있으면 소셜 연동만 추가
        const existingByEmail = await this.users.findByEmail(email);
        if (existingByEmail) {
            try {
                await this.users.linkOAuth(existingByEmail.id, provider, providerId);
                return this.toDto(existingByEmail);
            } catch (error) {
                return this.resolveUniqueConflict(error, provider, providerId);
            }
        }

        // 3. 신규 유저 + 소셜 연동 동시 생성(트랜잭션은 repository 가 캡슐화)
        try {
            const created = await this.users.createWithOAuth({
                provider,
                providerId,
                email,
                nickname,
            });
            return this.toDto(created);
        } catch (error) {
            return this.resolveUniqueConflict(error, provider, providerId);
        }
    }

    private toDto(user: User): LoginUser {
        return {
            userId: user.id,
            email: user.email,
            nickname: user.nickname,
            isPartner: user.isPartner,
        };
    }

    private async resolveUniqueConflict(
        error: unknown,
        provider: OAuthProvider,
        providerId: string,
    ): Promise<LoginUser> {
        if (!this.isPrismaUniqueError(error)) throw error;

        const linked = await this.users.findByOAuth(provider, providerId);
        if (!linked) throw error;

        return this.toDto(linked);
    }

    private isPrismaUniqueError(error: unknown): boolean {
        return (
            error !== null &&
            typeof error === 'object' &&
            'code' in error &&
            (error as Record<string, unknown>)['code'] === 'P2002'
        );
    }
}
