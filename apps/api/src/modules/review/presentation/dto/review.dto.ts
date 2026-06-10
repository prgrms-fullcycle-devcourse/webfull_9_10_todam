import {
    reviewWriteRequestSchema,
    reviewCreateResultSchema,
    reviewUpdateResultSchema,
    reviewImageUploadRequestSchema,
    reviewImageUploadResultSchema,
    reviewDetailResultSchema,
} from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// ─── 요청 DTO ─────────────────────────────────────────────────────────
/** POST /reservations/:reservationId/review 및 PATCH /reviews/:reviewId 공용 요청 바디 */
export class ReviewWriteRequestDto extends createZodDto(reviewWriteRequestSchema) {}

/** POST /review/images/presigned 요청 바디 */
export class ReviewImageUploadRequestDto extends createZodDto(reviewImageUploadRequestSchema) {}

// ─── 응답 DTO ─────────────────────────────────────────────────────────
/** POST /reservations/:reservationId/review 201 응답 */
export class ReviewCreateResultDto extends createZodDto(reviewCreateResultSchema) {}

/** PATCH /reviews/:reviewId 200 응답 */
export class ReviewUpdateResultDto extends createZodDto(reviewUpdateResultSchema) {}

/** POST /review/images/presigned 200 응답 */
export class ReviewImageUploadResultDto extends createZodDto(reviewImageUploadResultSchema) {}

/** GET /reservations/:reservationId/review 200 응답 */
export class ReviewDetailResultDto extends createZodDto(reviewDetailResultSchema) {}
