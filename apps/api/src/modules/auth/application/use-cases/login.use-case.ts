import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { PrismaService } from '../../../../database/prisma.service';
import type { LoginDto, LoginResponseDto } from '../../presentation/dto/login.dto';
import { TokenService } from '../token.service';

// 이메일/비밀번호 오류 모두 동일한 메시지 → 어느 쪽이 틀렸는지 노출하지 않음
const INVALID_CREDENTIALS_MSG = '이메일 또는 비밀번호가 올바르지 않습니다.';

@Injectable()
export class LoginUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly tokenService: TokenService,
    ) {}

    async execute(dto: LoginDto, res: Response): Promise<LoginResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            select: { id: true, password: true, status: true },
        });

        // 존재하지 않거나, 소셜 전용 가입(password null)이거나, 탈퇴한 경우
        if (!user || !user.password || user.status === UserStatus.WITHDRAWN) {
            throw new UnauthorizedException(INVALID_CREDENTIALS_MSG);
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException(INVALID_CREDENTIALS_MSG);
        }

        const accessToken = this.tokenService.signAccessToken(user.id);
        await this.tokenService.issueRefreshToken(user.id, res);

        return { accessToken };
    }
}
