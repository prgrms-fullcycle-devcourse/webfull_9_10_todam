import { HttpStatus } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';
import { BusinessException } from '../../../../common/exceptions/business.exception';

interface ZodLikeError {
    issues?: ReadonlyArray<{ message?: string }>;
}

export const AdminStoreRejectValidationPipe = createZodValidationPipe({
    createValidationException: (error) =>
        new BusinessException(
            'REJECTION_REASON_REQUIRED',
            (error as ZodLikeError).issues?.[0]?.message ?? '반려 사유를 입력해주세요.',
            HttpStatus.BAD_REQUEST,
        ),
});
