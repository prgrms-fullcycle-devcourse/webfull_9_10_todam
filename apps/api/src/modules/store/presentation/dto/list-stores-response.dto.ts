import { storeListResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 응답 SSOT = @todam/shared(zod). GET /stores 공방 목록(커서 페이지네이션).
export class ListStoresResponseDto extends createZodDto(storeListResultSchema) {}
