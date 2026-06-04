import { HttpStatus, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';

// GET /stores/:slug/reviews 쿼리 검증 전용 파이프.
// contract: cursor/limit/sort 형식 오류 시 400 INVALID_QUERY_PARAMETERS.
export class ListStoreReviewsQueryPipe extends ValidationPipe {
    constructor() {
        super({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: false },
            exceptionFactory: (errors: ValidationError[]) => {
                const message = ListStoreReviewsQueryPipe.firstMessage(errors);
                return new BusinessException(
                    'INVALID_QUERY_PARAMETERS',
                    message,
                    HttpStatus.BAD_REQUEST,
                );
            },
        });
    }

    private static firstMessage(errors: ValidationError[]): string {
        for (const error of errors) {
            if (error.constraints) {
                const first = Object.values(error.constraints)[0];
                if (first) {
                    return first;
                }
            }
        }
        return '잘못된 쿼리 파라미터입니다.';
    }
}
