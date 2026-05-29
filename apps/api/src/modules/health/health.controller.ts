import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { S3Service } from '../../common/s3/s3.service';
import { buildObjectKey } from '../../common/s3/s3-object.util';

@Controller('health')
export class HealthController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly s3: S3Service,
    ) {}

    @Get('db')
    async checkDatabase(): Promise<{ ok: boolean }> {
        await this.prisma.$queryRaw`SELECT 1`;

        return { ok: true };
    }

    @Get('s3')
    async checkS3() {
        const key = buildObjectKey('test', 'image/jpeg');
        return this.s3.createPresignedPutUrl(key, 'image/jpeg');
    }
}
