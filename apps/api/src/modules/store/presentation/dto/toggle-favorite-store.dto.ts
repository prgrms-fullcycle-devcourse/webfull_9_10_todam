import { toggleFavoriteResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 응답 SSOT = @todam/shared(zod). POST /stores/:storeId/favorite 토글 결과(공통 봉투 data).
export class ToggleFavoriteStoreResponseDto extends createZodDto(toggleFavoriteResultSchema) {}
