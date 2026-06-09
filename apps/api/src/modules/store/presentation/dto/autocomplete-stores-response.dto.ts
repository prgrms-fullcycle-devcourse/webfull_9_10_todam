import { autocompleteResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 응답 SSOT = @todam/shared(zod). GET /stores/search/autocomplete 자동완성 목록.
export class AutocompleteStoresResponseDto extends createZodDto(autocompleteResultSchema) {}
