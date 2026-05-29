import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import type { JwtPayload } from '../../../common/types/jwt-payload.type';
import { PrismaService } from '../../../database/prisma.service';

const BCRYPT_ROUNDS = 10;
const REFRESH_TOKEN_EXPIRES_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class TokenService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    signAccessToken(userId: string): string {
        const payload: JwtPayload = { sub: userId };
        return this.jwtService.sign(payload);
    }

    async issueRefreshToken(userId: string, res: Response): Promise<void> {
        const token = randomUUID();
        const tokenHash = await bcrypt.hash(token, BCRYPT_ROUNDS);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * MS_PER_DAY);

        await this.prisma.refreshToken.create({
            data: { userId, tokenHash, expiresAt },
        });

        res.cookie('refresh_token', token, {
            httpOnly: true,
            secure: process.env['NODE_ENV'] === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_TOKEN_EXPIRES_DAYS * MS_PER_DAY,
            path: '/',
        });
    }
}
