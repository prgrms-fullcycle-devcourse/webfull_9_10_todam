// Prisma row ↔ RefreshToken 도메인 엔티티 변환.

import { RefreshToken } from '../../domain/entities/refresh-token.entity';

export interface RefreshTokenRow {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
}

export class RefreshTokenMapper {
    static toDomain(row: RefreshTokenRow): RefreshToken {
        return new RefreshToken(row.id, row.userId, row.tokenHash, row.expiresAt);
    }
}
