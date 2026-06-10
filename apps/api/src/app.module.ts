import { Module } from '@nestjs/common';
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

@Module({
    imports: [
        DatabaseModule,
        AccessModule,
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
    ],
})
export class AppModule {}
