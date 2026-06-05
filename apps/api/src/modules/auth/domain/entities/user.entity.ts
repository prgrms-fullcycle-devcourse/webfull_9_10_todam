// 유저 도메인 엔티티 — Prisma/Nest 비의존(순수).
// 영속 계층(Prisma row)과의 변환은 infrastructure/persistence 의 mapper 가 담당한다.

/** 소셜 로그인 제공자. Prisma OAuthProvider enum 과 값이 일치(google/kakao). */
export type OAuthProvider = 'google' | 'kakao';

/** 계정 상태. Prisma UserStatus enum 과 값이 일치(ACTIVE/WITHDRAWN). */
export type UserAccountStatus = 'ACTIVE' | 'WITHDRAWN';

export class User {
    constructor(
        readonly id: string,
        readonly email: string,
        readonly nickname: string,
        /** bcrypt 해시. 소셜 전용 가입은 null. */
        readonly passwordHash: string | null,
        readonly isPartner: boolean,
        readonly emailVerified: boolean,
        readonly status: UserAccountStatus,
        readonly createdAt: Date,
        readonly updatedAt: Date,
    ) {}

    isWithdrawn(): boolean {
        return this.status === 'WITHDRAWN';
    }

    /** 비밀번호 로그인 가능 여부 — 소셜 전용 계정(passwordHash null)·탈퇴 계정은 불가. */
    canLoginWithPassword(): boolean {
        return this.passwordHash !== null && !this.isWithdrawn();
    }
}
