import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { TokenService } from '../token.service';

@Injectable()
export class RefreshUseCase {
    constructor(
        private readonly refreshTokens: RefreshTokenRepository,
        private readonly tokenService: TokenService,
    ) {}

    async execute(
        cookieValue: string | undefined,
        res: Response,
    ): Promise<{ accessToken: string }> {
        if (!cookieValue) throw new UnauthorizedException();

        // 쿠키 파싱: "<dbId>.<rawToken>"
        const dotIndex = cookieValue.indexOf('.');
        if (dotIndex === -1) throw new UnauthorizedException();

        const tokenId = cookieValue.substring(0, dotIndex);
        const rawToken = cookieValue.substring(dotIndex + 1);

        const stored = await this.refreshTokens.findById(tokenId);
        if (!stored) throw new UnauthorizedException();

        // 만료 확인
        if (stored.isExpired(new Date())) {
            await this.refreshTokens.deleteById(stored.id);
            throw new UnauthorizedException();
        }

        // 해시 비교
        const isValid = await bcrypt.compare(rawToken, stored.tokenHash);
        if (!isValid) {
            // 토큰 불일치 = 도용 가능성 → 해당 유저 토큰 전체 삭제
            await this.refreshTokens.deleteByUserId(stored.userId);
            throw new UnauthorizedException();
        }

        // rotation: 기존 토큰 삭제 후 새 토큰 발급
        await this.refreshTokens.deleteById(stored.id);

        const accessToken = this.tokenService.signAccessToken(stored.userId);
        await this.tokenService.issueRefreshToken(stored.userId, res);

        return { accessToken };
    }
}
