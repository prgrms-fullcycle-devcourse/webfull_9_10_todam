import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { createApiEnv } from '@todam/config';
import { DatabaseModule } from './database/database.module';
import { AccessModule } from './common/access/access.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { StoreModule } from './modules/store/store.module';
import { ProgramModule } from './modules/program/program.module';
import { TimeslotModule } from './modules/timeslot/timeslot.module';
import { ReservationModule } from './modules/reservation/reservation.module';
import { S3Module } from './common/s3/s3.module';
import { VisionModule } from './common/vision/vision.module';
import { RedisModule } from './redis/redis.module';
import { ArtworkModule } from './modules/artwork/artwork.module';
import { PartnerModule } from './modules/partner/partner.module';
import { UserModule } from './modules/user/user.module';
import { ReviewModule } from './modules/review/review.module';
import { PolicyModule } from './modules/policy/policy.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
    imports: [
        DatabaseModule,
        AccessModule,
        // BullMQ 전역 Redis 연결 — config(apiSchema)의 REDIS_URL 경유(기본값 포함).
        BullModule.forRoot({
            connection: {
                url: createApiEnv().REDIS_URL,
            },
        }),
        RedisModule,
        AuthModule,
        HealthModule,
        S3Module,
        VisionModule,
        StoreModule,
        TimeslotModule,
        ProgramModule,
        ReservationModule,
        ArtworkModule,
        PartnerModule,
        UserModule,
        ReviewModule,
        PolicyModule,
        AdminModule,
        NotificationModule,
    ],
})
export class AppModule {}
