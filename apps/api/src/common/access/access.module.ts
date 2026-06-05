import { Global, Module } from '@nestjs/common';
import { StoreOwnershipService } from './store-ownership.service';

// 공방 소유권 검증을 전 모듈이 공유하도록 전역 제공.
@Global()
@Module({
    providers: [StoreOwnershipService],
    exports: [StoreOwnershipService],
})
export class AccessModule {}
