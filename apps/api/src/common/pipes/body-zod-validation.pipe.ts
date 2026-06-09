import { HttpStatus } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';
import { BusinessException } from '../exceptions/business.exception';

// zod 를 api 직접 의존성으로 끌어오지 않기 위한 최소 구조적 타입(ZodError 호환).
interface ZodLikeError {
    issues?: ReadonlyArray<{ message?: string }>;
}

// 요청 body zod 검증 파이프. 실패 시 errorCode 'INVALID_REQUEST' / 400 으로 매핑한다
// (응답 봉투 계약 보존). QueryZodValidationPipe 와 동일 패턴.
export const BodyZodValidationPipe = createZodValidationPipe({
    createValidationException: (error) =>
        new BusinessException(
            'INVALID_REQUEST',
            (error as ZodLikeError).issues?.[0]?.message ?? '잘못된 요청입니다.',
            HttpStatus.BAD_REQUEST,
        ),
});
