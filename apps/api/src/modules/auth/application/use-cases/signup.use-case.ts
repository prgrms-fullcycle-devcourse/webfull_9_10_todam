import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { PrismaService } from '../../../../database/prisma.service';
import { RedisService } from '../../../../redis/redis.service';
import { TokenService } from '../token.service';
import type { SignupDto, SignupResponseDto } from '../../presentation/dto/signup.dto';

const BCRYPT_ROUNDS = 10;

function generateRandomNickname(): string {
    return `사용자_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

@Injectable()
export class SignupUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly tokenService: TokenService,
    ) {}

    async execute(dto: SignupDto, res: Response): Promise<SignupResponseDto> {
        const verified = await this.redis.get(`email:verified:${dto.email}`);
        if (!verified) {
            throw new BadRequestException('이메일 인증이 필요합니다.');
        }

        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
            select: { id: true },
        });
        if (existing) {
            throw new ConflictException('이미 가입된 이메일입니다.');
        }

        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

        const nickname = dto.nickname ?? generateRandomNickname();

        const user = await this.prisma.user.create({
            data: { email: dto.email, password: passwordHash, nickname },
            select: { id: true },
        });

        await this.redis.del(`email:verified:${dto.email}`);

        const accessToken = this.tokenService.signAccessToken(user.id);
        await this.tokenService.issueRefreshToken(user.id, res);

        return { accessToken };
    }
}
