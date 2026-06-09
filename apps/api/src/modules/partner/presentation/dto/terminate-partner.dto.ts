import { terminatePartnerResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

export const TerminatePartnerResponseDto = createZodDto(terminatePartnerResultSchema);
