import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import {
    CreateRefreshTokenInput,
    RefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository';
import { RefreshTokenMapper } from './refresh-token.mapper';

@Injectable()
export class PrismaRefreshTokenRepository extends RefreshTokenRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async create(input: CreateRefreshTokenInput): Promise<{ id: string }> {
        const { id } = await this.prisma.refreshToken.create({
            data: {
                userId: input.userId,
                tokenHash: input.tokenHash,
                expiresAt: input.expiresAt,
            },
            select: { id: true },
        });
        return { id };
    }

    async findById(id: string): Promise<RefreshToken | null> {
        const row = await this.prisma.refreshToken.findUnique({
            where: { id },
            select: { id: true, userId: true, tokenHash: true, expiresAt: true },
        });
        return row ? RefreshTokenMapper.toDomain(row) : null;
    }

    async deleteById(id: string): Promise<void> {
        await this.prisma.refreshToken.delete({ where: { id } });
    }

    async deleteByUserId(userId: string): Promise<void> {
        await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }

    async deleteByIdAndUser(id: string, userId: string): Promise<void> {
        await this.prisma.refreshToken.deleteMany({ where: { id, userId } });
    }
}
