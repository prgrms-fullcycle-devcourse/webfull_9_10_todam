import { partnerOnboardingResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 응답 SSOT = @todam/shared(zod). 파트너 온보딩 상태 조회 응답.
export class GetPartnerOnboardingResponseDto extends createZodDto(partnerOnboardingResultSchema) {}
