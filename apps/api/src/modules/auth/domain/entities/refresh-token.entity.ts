// 리프레시 토큰 도메인 엔티티 — Prisma/Nest 비의존(순수).
// 쿠키에는 "<id>.<rawToken>" 형태로 내려가고, DB 에는 rawToken 의 bcrypt 해시만 저장한다.

export class RefreshToken {
    constructor(
        readonly id: string,
        readonly userId: string,
        readonly tokenHash: string,
        readonly expiresAt: Date,
    ) {}

    isExpired(now: Date): boolean {
        return this.expiresAt < now;
    }
}
