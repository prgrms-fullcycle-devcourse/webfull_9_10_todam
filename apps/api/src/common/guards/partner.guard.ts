import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PartnerStatus } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import type { RequestUser } from '../types/request-user.type';

@Injectable()
export class PartnerGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<Request & { user: RequestUser }>();
        const user = req.user;

        const partner = await this.prisma.partner.findUnique({
            where: { userId: user.id },
            select: { status: true },
        });

        if (partner?.status !== PartnerStatus.APPROVED) {
            throw new ForbiddenException('파트너 권한이 없습니다.');
        }

        return true;
    }
}
