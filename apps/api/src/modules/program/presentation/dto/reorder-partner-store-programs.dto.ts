import { partnerProgramReorderRequestSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// PATCH /partner/stores/{storeId}/programs/order 요청 바디.
// programs[].id 집합은 해당 공방 전체 program 집합과 정확히 일치해야 한다(use-case 에서 검증).
// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class ReorderPartnerStoreProgramsDto extends createZodDto(
    partnerProgramReorderRequestSchema,
) {}
