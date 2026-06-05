import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';

@Injectable()
export class LogoutUseCase {
    constructor(private readonly refreshTokens: RefreshTokenRepository) {}

    async execute(userId: string, cookieValue: string | undefined, res: Response): Promise<void> {
        // 쿠키가 있으면 해당 refresh token만 삭제 (다른 기기 로그인은 유지)
        if (cookieValue) {
            const dotIndex = cookieValue.indexOf('.');
            if (dotIndex !== -1) {
                const tokenId = cookieValue.substring(0, dotIndex);
                // userId 조건을 함께 걸어 다른 유저 토큰을 지우는 걸 방지
                await this.refreshTokens.deleteByIdAndUser(tokenId, userId);
            }
        }

        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: process.env['NODE_ENV'] === 'production',
            sameSite: 'strict',
            path: '/',
        });
    }
}
