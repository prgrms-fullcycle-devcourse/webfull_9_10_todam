import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import type { Response } from 'express';
import type { OAuthResponseDto } from '../../presentation/dto/oauth-response.dto';
import { OAuthService } from '../oauth.service';
import { TokenService } from '../token.service';

interface GoogleTokenResponse {
    access_token: string;
}

interface GoogleUserResponse {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
}

@Injectable()
export class GoogleOAuthUseCase {
    constructor(
        private readonly oauthService: OAuthService,
        private readonly tokenService: TokenService,
    ) {}

    async execute(code: string, res: Response): Promise<OAuthResponseDto> {
        const googleAccessToken = await this.getGoogleToken(code);
        const googleUser = await this.getGoogleUser(googleAccessToken);

        if (!googleUser.verified_email) {
            throw new ForbiddenException(
                '구글 서비스 내에서 이메일 인증을 받지 않은 구글 계정은 접근이 불가능합니다.',
            );
        }

        const user = await this.oauthService.findOrCreateUser(
            'google',
            googleUser.id,
            googleUser.email,
            googleUser.name,
        );

        const accessToken = this.tokenService.signAccessToken(user.userId);
        await this.tokenService.issueRefreshToken(user.userId, res);

        return { accessToken, user };
    }

    private async getGoogleToken(code: string): Promise<string> {
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: process.env['GOOGLE_CLIENT_ID']!,
                client_secret: process.env['GOOGLE_CLIENT_SECRET']!,
                redirect_uri: process.env['GOOGLE_REDIRECT_URI']!,
                code,
            }),
        });

        if (!res.ok) {
            throw new BadRequestException('구글 인가 코드가 누락되었거나 변조되었습니다.');
        }

        const data = (await res.json()) as GoogleTokenResponse;
        return data.access_token;
    }

    private async getGoogleUser(accessToken: string): Promise<GoogleUserResponse> {
        const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
            throw new InternalServerErrorException(
                '구글 인증 시스템과의 통신 연동 과정에서 예외 장애가 발생했습니다.',
            );
        }

        return (await res.json()) as GoogleUserResponse;
    }
}
