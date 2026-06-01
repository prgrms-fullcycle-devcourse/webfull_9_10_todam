import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../../database/prisma.service';
import { RedisService } from '../../../../redis/redis.service';
import type { ResetPasswordDto } from '../../presentation/dto/reset-password.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class ResetPasswordUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
    ) {}

    async execute(dto: ResetPasswordDto): Promise<void> {
        const { email, code, newPassword } = dto;

        const stored = await this.redis.get(`password:reset:${email}`);
        if (!stored || stored !== code) {
            throw new BadRequestException('유효하지 않거나 만료된 인증코드입니다.');
        }

        const user = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });
        if (!user) {
            throw new BadRequestException('유효하지 않거나 만료된 인증코드입니다.');
        }

        const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: user.id },
                data: { password: passwordHash },
            }),
            this.prisma.refreshToken.deleteMany({
                where: { userId: user.id },
            }),
        ]);

        await this.redis.del(`password:reset:${email}`);
    }
}
