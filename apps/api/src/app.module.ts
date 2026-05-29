import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { S3Module } from './common/s3/s3.module';

@Module({
    imports: [DatabaseModule, AuthModule, HealthModule, S3Module],
})
export class AppModule {}
