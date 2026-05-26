import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) {}

    @Get('db')
    async checkDatabase(): Promise<{ ok: boolean; version: string }> {
        await this.prisma.$queryRaw`SELECT 1`;

        return { ok: true, version: 'deploy-test-1' };
    }
}
