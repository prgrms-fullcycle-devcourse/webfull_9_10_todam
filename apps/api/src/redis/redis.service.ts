import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client!: Redis;

    onModuleInit(): void {
        this.client = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379');
    }

    onModuleDestroy(): void {
        this.client.disconnect();
    }

    async set(key: string, value: string, ttlSeconds: number): Promise<void> {
        await this.client.set(key, value, 'EX', ttlSeconds);
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    async ttl(key: string): Promise<number> {
        return this.client.ttl(key);
    }
}
