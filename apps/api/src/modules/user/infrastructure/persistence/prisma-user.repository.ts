import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
    UpdateProfileData,
    UserProfileRow,
    UserRepository,
    WithdrawTargetRow,
} from '../../domain/repositories/user.repository';

const USER_PROFILE_SELECT = {
    id: true,
    email: true,
    nickname: true,
    isPartner: true,
    password: true,
    reserverName: true,
    reserverPhone: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} as const;

// Prisma select 결과 → 도메인 행 매핑(password는 hasPassword 로 환산하고 노출하지 않음).
function toProfileRow(user: {
    id: string;
    email: string;
    nickname: string;
    isPartner: boolean;
    password: string | null;
    reserverName: string | null;
    reserverPhone: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}): UserProfileRow {
    return {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        isPartner: user.isPartner,
        hasPassword: user.password !== null,
        reserverName: user.reserverName,
        reserverPhone: user.reserverPhone,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

@Injectable()
export class PrismaUserRepository extends UserRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findById(userId: string): Promise<UserProfileRow | null> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: USER_PROFILE_SELECT,
        });

        if (!user) return null;

        return toProfileRow(user);
    }

    async existsByNicknameExceptUser(nickname: string, excludeUserId: string): Promise<boolean> {
        const count = await this.prisma.user.count({
            where: {
                nickname,
                id: { not: excludeUserId },
            },
        });

        return count > 0;
    }

    async updateProfile(userId: string, data: UpdateProfileData): Promise<UserProfileRow> {
        // 전달된 key만 갱신(undefined 필드는 Prisma가 무시) → partial 업데이트.
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                nickname: data.nickname,
                reserverName: data.reserverName,
                reserverPhone: data.reserverPhone,
            },
            select: USER_PROFILE_SELECT,
        });

        return toProfileRow(user);
    }

    // ─── 회원탈퇴 ─────────────────────────────────────────────────────────────

    async findWithdrawTarget(userId: string): Promise<WithdrawTargetRow | null> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, password: true, status: true },
        });

        return user ?? null;
    }

    async hasActivePartner(userId: string): Promise<boolean> {
        const count = await this.prisma.partner.count({
            where: {
                userId,
                status: 'APPROVED',
                terminatedAt: null,
            },
        });

        return count > 0;
    }

    async hasActiveReservations(userId: string): Promise<boolean> {
        const count = await this.prisma.reservation.count({
            where: {
                userId,
                status: {
                    notIn: ['CANCELED', 'DELIVERED', 'PICKUP_DONE'],
                },
            },
        });

        return count > 0;
    }

    async hasActiveArtworks(userId: string): Promise<boolean> {
        const count = await this.prisma.artwork.count({
            where: {
                reservation: { userId },
                status: {
                    notIn: ['COMPLETED', 'CANCELED'],
                },
            },
        });

        return count > 0;
    }

    async withdraw(userId: string): Promise<void> {
        const now = new Date();
        // 결정적 유니크 해시: sha256(userId) — Math.random/Date.now 금지
        const hash = createHash('sha256').update(userId).digest('hex');
        const emailPrefix = hash.slice(0, 16);
        const nicknamePrefix = hash.slice(0, 8);

        const anonymizedEmail = `withdrawn_${emailPrefix}@anonymized.todam`;
        const anonymizedNickname = `탈퇴회원_${nicknamePrefix}`;

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: userId },
                data: {
                    status: 'WITHDRAWN',
                    withdrawnAt: now,
                    email: anonymizedEmail,
                    nickname: anonymizedNickname,
                    password: null,
                },
            }),
            this.prisma.oAuthAccount.deleteMany({ where: { userId } }),
            this.prisma.refreshToken.deleteMany({ where: { userId } }),
        ]);
    }
}
