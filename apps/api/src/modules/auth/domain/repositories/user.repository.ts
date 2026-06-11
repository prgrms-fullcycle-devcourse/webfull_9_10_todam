// User 영속 포트(추상 클래스 = DI 토큰).
// 구현은 infrastructure/persistence/prisma-user.repository.ts.
// 멀티-write(트랜잭션)는 메서드 하나가 통째로 캡슐화한다.

import { PolicyType } from '@todam/shared';
import { OAuthProvider, User } from '../entities/user.entity';

export interface CreateUserInput {
    email: string;
    /** bcrypt 해시. 소셜 전용 가입은 null. */
    passwordHash: string | null;
    nickname: string;
    emailVerified: boolean;
}

export interface CreateOAuthUserInput {
    email: string;
    nickname: string;
    provider: OAuthProvider;
    providerId: string;
}

export abstract class UserRepository {
    abstract findById(id: string): Promise<User | null>;
    abstract findByEmail(email: string): Promise<User | null>;
    abstract findByOAuth(provider: OAuthProvider, providerId: string): Promise<User | null>;
    abstract create(input: CreateUserInput): Promise<User>;

    /**
     * 신규 유저 + 동의 약관 이력(UserConsent)을 한 트랜잭션으로 생성.
     * agreedPolicyTypes 각 항목의 isLatest=true PolicyVersion을 조회해 isAgreed=true로 기록한다.
     * 최신 약관 버전이 없으면(시드 누락) 에러를 던진다.
     */
    abstract createWithConsents(
        input: CreateUserInput,
        agreedPolicyTypes: PolicyType[],
    ): Promise<User>;

    abstract linkOAuth(userId: string, provider: OAuthProvider, providerId: string): Promise<void>;

    /** 신규 유저 + 소셜 연동(OAuthAccount)을 한 트랜잭션으로 생성. */
    abstract createWithOAuth(input: CreateOAuthUserInput): Promise<User>;

    /** 비밀번호 변경 + 해당 유저의 모든 refresh token 폐기를 한 트랜잭션으로 처리(세션 무효화). */
    abstract updatePasswordAndRevokeTokens(userId: string, passwordHash: string): Promise<void>;
}
