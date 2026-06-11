import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../../database/prisma.service';

export interface AdminJwtPayload {
    sub: string;
    type: 'admin';
}

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
    constructor(private readonly prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env['JWT_ADMIN_SECRET']!,
        });
    }

    async validate(payload: AdminJwtPayload): Promise<{ id: string; type: 'admin' }> {
        if (payload.type !== 'admin') throw new UnauthorizedException();
        const admin = await this.prisma.admin.findUnique({
            where: { id: payload.sub },
            select: { id: true },
        });
        if (!admin) throw new UnauthorizedException();
        return { id: admin.id, type: 'admin' };
    }
}
