import { Controller, Get } from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';

@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) {}

    @Get('db')
    async checkDatabase(): Promise<{ ok: boolean }> {
        await this.prisma.$queryRaw`SELECT 1`;

        return { ok: true };
    }
}
