import { programDetailResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 응답 SSOT = @todam/shared(zod). 파트너/공개 클래스 상세 겸용(union: capacity/programImageId/isThumbnail optional).
export class GetProgramDetailResponseDto extends createZodDto(programDetailResultSchema) {}
