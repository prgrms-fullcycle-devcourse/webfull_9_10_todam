import { listStoresQuerySchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param QueryZodValidationPipe.
// (전부 선택: lat/lng 위치 · keyword 통합검색 · cursor/limit 페이지네이션)
export class ListStoresQueryDto extends createZodDto(listStoresQuerySchema) {}
