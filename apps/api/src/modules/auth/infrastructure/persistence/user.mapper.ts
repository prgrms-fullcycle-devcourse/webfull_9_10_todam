// Prisma row ↔ User 도메인 엔티티 변환.

import { User, UserAccountStatus } from '../../domain/entities/user.entity';

export interface UserRow {
    id: string;
    email: string;
    nickname: string;
    password: string | null;
    isPartner: boolean;
    emailVerified: boolean;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export class UserMapper {
    static toDomain(row: UserRow): User {
        return new User(
            row.id,
            row.email,
            row.nickname,
            row.password,
            row.isPartner,
            row.emailVerified,
            row.status as UserAccountStatus,
            row.createdAt,
            row.updatedAt,
        );
    }
}
