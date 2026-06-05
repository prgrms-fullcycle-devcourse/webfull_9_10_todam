// RefreshToken 영속 포트(추상 클래스 = DI 토큰).
// 구현은 infrastructure/persistence/prisma-refresh-token.repository.ts.

import { RefreshToken } from '../entities/refresh-token.entity';

export interface CreateRefreshTokenInput {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
}

export abstract class RefreshTokenRepository {
    /** 생성 후 쿠키 식별자로 쓸 DB id 를 반환. */
    abstract create(input: CreateRefreshTokenInput): Promise<{ id: string }>;
    abstract findById(id: string): Promise<RefreshToken | null>;
    abstract deleteById(id: string): Promise<void>;
    /** 도용 의심·비밀번호 변경 시 해당 유저 토큰 전체 폐기. */
    abstract deleteByUserId(userId: string): Promise<void>;
    /** 로그아웃 — 다른 유저 토큰을 지우지 않도록 userId 를 함께 건다. */
    abstract deleteByIdAndUser(id: string, userId: string): Promise<void>;
}
