import { storeReviewListResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 응답 SSOT = @todam/shared(zod). 공방 리뷰 목록 조회 응답(커서 페이지네이션).
export class ListStoreReviewsResponseDto extends createZodDto(storeReviewListResultSchema) {}
