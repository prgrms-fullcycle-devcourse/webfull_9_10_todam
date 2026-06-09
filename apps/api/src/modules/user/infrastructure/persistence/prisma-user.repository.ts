import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { UserProfileRow, UserRepository } from '../../domain/repositories/user.repository';

const USER_PROFILE_SELECT = {
    id: true,
    email: true,
    nickname: true,
    isPartner: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} as const;

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

        return {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            isPartner: user.isPartner,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
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

    async updateNickname(userId: string, nickname: string): Promise<UserProfileRow> {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { nickname },
            select: USER_PROFILE_SELECT,
        });

        return {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            isPartner: user.isPartner,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
