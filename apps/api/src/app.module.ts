import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { S3Module } from './common/s3/s3.module';

@Module({
    imports: [DatabaseModule, HealthModule, S3Module],
})
export class AppModule {}
