import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { PrismaService } from '../../../../database/prisma.service';
import { RedisService } from '../../../../redis/redis.service';
import type { JwtPayload } from '../../../../common/types/jwt-payload.type';
import type { SignupDto, SignupResponseDto } from '../../presentation/dto/signup.dto';

const BCRYPT_ROUNDS = 10;
const REFRESH_TOKEN_EXPIRES_DAYS = 14;

@Injectable()
export class SignupUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly jwtService: JwtService,
    ) {}

    async execute(dto: SignupDto, res: Response): Promise<SignupResponseDto> {
        // 1. 이메일 인증 완료 여부 확인
        const verified = await this.redis.get(`email:verified:${dto.email}`);
        if (!verified) {
            throw new BadRequestException('이메일 인증이 필요합니다.');
        }

        // 2. 이미 가입된 이메일인지 확인
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
            select: { id: true },
        });
        if (existing) {
            throw new ConflictException('이미 가입된 이메일입니다.');
        }

        // 3. 비밀번호 해시
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

        // 4. 유저 생성
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: passwordHash,
                nickname: dto.nickname,
            },
            select: { id: true },
        });

        // 5. 인증 완료 마킹 삭제 (재사용 방지)
        await this.redis.del(`email:verified:${dto.email}`);

        // 6. Access token 발급
        const payload: JwtPayload = { sub: user.id };
        const accessToken = this.jwtService.sign(payload);

        // 7. Refresh token 발급 → DB 저장 → HttpOnly cookie
        await this.issueRefreshToken(user.id, res);

        return { accessToken };
    }

    private async issueRefreshToken(userId: string, res: Response): Promise<void> {
        const token = randomUUID();
        const tokenHash = await bcrypt.hash(token, BCRYPT_ROUNDS);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

        await this.prisma.refreshToken.create({
            data: { userId, tokenHash, expiresAt },
        });

        res.cookie('refresh_token', token, {
            httpOnly: true,
            secure: process.env['NODE_ENV'] === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
            path: '/',
        });
    }
}
