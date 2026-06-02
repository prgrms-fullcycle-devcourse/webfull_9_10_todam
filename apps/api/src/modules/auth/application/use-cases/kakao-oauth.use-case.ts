import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import type { Response } from 'express';
import type { OAuthResponseDto } from '../../presentation/dto/oauth-response.dto';
import { OAuthService } from '../oauth.service';
import { TokenService } from '../token.service';

interface KakaoTokenResponse {
    access_token: string;
}

interface KakaoUserResponse {
    id: number;
    kakao_account?: {
        email?: string;
        profile?: {
            nickname?: string;
        };
    };
}

@Injectable()
export class KakaoOAuthUseCase {
    constructor(
        private readonly oauthService: OAuthService,
        private readonly tokenService: TokenService,
    ) {}

    async execute(code: string, res: Response): Promise<OAuthResponseDto> {
        const kakaoAccessToken = await this.getKakaoToken(code);
        const kakaoUser = await this.getKakaoUser(kakaoAccessToken);

        const email = kakaoUser.kakao_account?.email;
        if (!email) {
            throw new BadRequestException('카카오 계정에서 이메일 정보를 가져올 수 없습니다.');
        }

        const providerId = String(kakaoUser.id);
        const nickname =
            kakaoUser.kakao_account?.profile?.nickname ??
            `사용자_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

        const user = await this.oauthService.findOrCreateUser('kakao', providerId, email, nickname);

        const accessToken = this.tokenService.signAccessToken(user.userId);
        await this.tokenService.issueRefreshToken(user.userId, res);

        return { accessToken, user };
    }

    private async getKakaoToken(code: string): Promise<string> {
        const res = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: process.env['KAKAO_CLIENT_ID']!,
                client_secret: process.env['KAKAO_CLIENT_SECRET']!,
                redirect_uri: process.env['KAKAO_REDIRECT_URI']!,
                code,
            }),
        });

        if (!res.ok) {
            throw new BadRequestException('유효하지 않은 인가 코드이거나 카카오 인증에 실패했습니다.');
        }

        const data = (await res.json()) as KakaoTokenResponse;
        return data.access_token;
    }

    private async getKakaoUser(accessToken: string): Promise<KakaoUserResponse> {
        const res = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
            throw new InternalServerErrorException(
                '카카오 인증 처리 중 외부 인증 서버 오류가 발생했습니다.',
            );
        }

        return (await res.json()) as KakaoUserResponse;
    }
}
