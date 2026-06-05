import { listStoreReviewsQuerySchema, storeReviewSortSchema } from '@todam/shared';
import type { StoreReviewSort as SharedStoreReviewSort } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 정렬 값 SSOT = shared(zod). 도메인/인프라가 참조하므로 재노출.
export const STORE_REVIEW_SORTS = storeReviewSortSchema.options;
export type StoreReviewSort = SharedStoreReviewSort;

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param QueryZodValidationPipe.
// (전부 선택: cursor opaque · limit 기본 10 · sort latest|rating_high 기본 latest)
export class ListStoreReviewsQueryDto extends createZodDto(listStoreReviewsQuerySchema) {}
