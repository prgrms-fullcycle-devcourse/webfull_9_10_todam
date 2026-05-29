import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '../../../../common/types/jwt-payload.type';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { PrismaService } from '../../../../database/prisma.service';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private readonly prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env['JWT_ACCESS_SECRET'],
        });
    }

    async validate(payload: JwtPayload): Promise<RequestUser> {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, status: true },
        });

        if (!user || user.status === UserStatus.WITHDRAWN) {
            throw new UnauthorizedException();
        }

        return { id: user.id, status: user.status };
    }
}
