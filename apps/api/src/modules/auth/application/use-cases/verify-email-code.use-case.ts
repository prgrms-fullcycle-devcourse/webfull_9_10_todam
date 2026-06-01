import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisService } from '../../../../redis/redis.service';

// 인증 완료 후 signup까지 허용하는 유효 시간: 10분
const VERIFIED_TTL_SECONDS = 600;

@Injectable()
export class VerifyEmailCodeUseCase {
    constructor(private readonly redis: RedisService) {}

    async execute(email: string, code: string): Promise<void> {
        const key = `email:verify:${email}`;
        const storedCode = await this.redis.get(key);

        if (!storedCode) {
            throw new BadRequestException('인증코드가 만료되었거나 존재하지 않습니다.');
        }

        if (storedCode !== code) {
            throw new BadRequestException('인증코드가 올바르지 않습니다.');
        }

        // 일회성: 사용된 코드 삭제
        await this.redis.del(key);

        // 인증 완료 마킹 → signup 시 확인
        await this.redis.set(`email:verified:${email}`, '1', VERIFIED_TTL_SECONDS);
    }
}
