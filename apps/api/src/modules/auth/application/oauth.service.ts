import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { OAuthUserDto } from '../presentation/dto/oauth-response.dto';

@Injectable()
export class OAuthService {
    constructor(private readonly prisma: PrismaService) {}

    async findOrCreateUser(
        provider: 'kakao' | 'google',
        providerId: string,
        email: string,
        nickname: string,
    ): Promise<OAuthUserDto> {
        // 1. 이미 연동된 OAuthAccount가 있는지 확인
        const existing = await this.prisma.oAuthAccount.findUnique({
            where: { provider_providerId: { provider, providerId } },
            select: { userId: true },
        });

        let userId: string;

        if (existing) {
            userId = existing.userId;
        } else {
            // 2. 동일 이메일로 가입된 유저가 있는지 확인
            const existingUser = await this.prisma.user.findUnique({
                where: { email },
                select: { id: true },
            });

            if (existingUser) {
                // 기존 이메일 유저에 소셜 연동 추가
                await this.prisma.oAuthAccount.create({
                    data: { userId: existingUser.id, provider, providerId },
                });
                userId = existingUser.id;
            } else {
                // 신규 유저 생성 + 소셜 연동 동시 처리
                const result = await this.prisma.$transaction(async (tx) => {
                    const newUser = await tx.user.create({
                        data: { email, nickname, password: null },
                        select: { id: true },
                    });
                    await tx.oAuthAccount.create({
                        data: { userId: newUser.id, provider, providerId },
                    });
                    return newUser;
                });
                userId = result.id;
            }
        }

        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { id: true, email: true, nickname: true, isPartner: true },
        });

        return {
            userId: user.id,
            email: user.email,
            nickname: user.nickname,
            isPartner: user.isPartner,
        };
    }
}
