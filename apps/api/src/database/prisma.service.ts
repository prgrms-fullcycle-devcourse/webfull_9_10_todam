import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        const databaseUrl = process.env['DATABASE_URL'];

        if (!databaseUrl) {
            throw new Error('DATABASE_URL is required');
        }

        // 로컬 docker postgres 는 SSL 미지원 → localhost 면 SSL 비활성(원격은 기존대로 강제).
        const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(databaseUrl);
        const adapter = new PrismaPg({
            connectionString: databaseUrl,
            ssl: isLocal ? false : { rejectUnauthorized: false },
        });

        super({ adapter });
    }

    async onModuleInit(): Promise<void> {
        await this.$connect();
    }

    async onModuleDestroy(): Promise<void> {
        await this.$disconnect();
    }
}
