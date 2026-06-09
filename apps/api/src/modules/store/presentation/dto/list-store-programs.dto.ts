import { storeProgramListResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 응답 SSOT = @todam/shared(zod). GET /stores/{slug}/programs 공개 공방 클래스 목록.
export class ListStoreProgramsResponseDto extends createZodDto(storeProgramListResultSchema) {}
