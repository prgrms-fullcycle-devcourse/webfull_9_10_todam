import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AdminLoginRequest, AdminLoginResponse } from '@todam/shared';
import * as bcrypt from 'bcrypt';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { PrismaService } from '../../../../database/prisma.service';

const DUMMY_PASSWORD_HASH = '$2b$10$bsLvaXzfBIaV58bkqI9/EuyEMz/3Bt/H.2DCVKHyLKQXAUqX91r/.';

@Injectable()
export class AdminLoginUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
    ) {}

    async execute(dto: AdminLoginRequest): Promise<AdminLoginResponse> {
        const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });
        const isPasswordValid = await bcrypt.compare(
            dto.password,
            admin?.password ?? DUMMY_PASSWORD_HASH,
        );
        if (!admin || !isPasswordValid) {
            throw new BusinessException(
                'INVALID_CREDENTIALS',
                '이메일 또는 비밀번호가 올바르지 않습니다.',
                HttpStatus.UNAUTHORIZED,
            );
        }

        return {
            admin: { id: admin.id, email: admin.email, name: admin.name },
            accessToken: this.jwt.sign({ sub: admin.id, type: 'admin' }),
        };
    }
}
