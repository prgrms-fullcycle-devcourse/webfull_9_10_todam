import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { StoreModule } from './modules/store/store.module';
import { S3Module } from './common/s3/s3.module';
import { RedisModule } from './redis/redis.module';

@Module({
    imports: [DatabaseModule, RedisModule, AuthModule, HealthModule, S3Module, StoreModule],
})
export class AppModule {}
