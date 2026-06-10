import { programReviewListResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 응답 DTO: SSOT = @todam/shared programReviewListResultSchema.
export class ListProgramReviewsResponseDto extends createZodDto(programReviewListResultSchema) {}
