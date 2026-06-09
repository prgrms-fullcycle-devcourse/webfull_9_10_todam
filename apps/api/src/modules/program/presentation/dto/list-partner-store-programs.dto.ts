import { partnerProgramListResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 응답 SSOT = @todam/shared(zod). 파트너센터 클래스 목록(GET) / 재정렬(PATCH) 공통 응답.
export class ListPartnerStoreProgramsResponseDto extends createZodDto(
    partnerProgramListResultSchema,
) {}
