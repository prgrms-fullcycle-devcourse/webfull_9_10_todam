import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import type { LoginRequest, LoginResponse } from '@todam/shared';
import { UserRepository } from '../../domain/repositories/user.repository';
import { TokenService } from '../token.service';

// 이메일/비밀번호 오류 모두 동일한 메시지 → 어느 쪽이 틀렸는지 노출하지 않음
const INVALID_CREDENTIALS_MSG = '이메일 또는 비밀번호가 올바르지 않습니다.';

@Injectable()
export class LoginUseCase {
    constructor(
        private readonly users: UserRepository,
        private readonly tokenService: TokenService,
    ) {}

    async execute(dto: LoginRequest, res: Response): Promise<LoginResponse> {
        const user = await this.users.findByEmail(dto.email);

        // 존재하지 않거나, 소셜 전용 가입(password null)이거나, 탈퇴한 경우
        if (!user || !user.canLoginWithPassword()) {
            throw new UnauthorizedException(INVALID_CREDENTIALS_MSG);
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash!);
        if (!isPasswordValid) {
            throw new UnauthorizedException(INVALID_CREDENTIALS_MSG);
        }

        const accessToken = this.tokenService.signAccessToken(user.id);
        await this.tokenService.issueRefreshToken(user.id, res);

        return {
            accessToken,
            user: {
                userId: user.id,
                email: user.email,
                nickname: user.nickname,
                isPartner: user.isPartner,
            },
        };
    }
}
