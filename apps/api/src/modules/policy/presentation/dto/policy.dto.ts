import { latestPoliciesResponseSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

/** GET /policies/latest 200 응답 DTO */
export class LatestPoliciesResponseDto extends createZodDto(latestPoliciesResponseSchema) {}
