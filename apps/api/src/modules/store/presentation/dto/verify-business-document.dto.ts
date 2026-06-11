import {
    businessDocumentVerifyRequestSchema,
    businessDocumentVerifyResultSchema,
} from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

export class VerifyBusinessDocumentDto extends createZodDto(businessDocumentVerifyRequestSchema) {}

export class VerifyBusinessDocumentResponseDto extends createZodDto(
    businessDocumentVerifyResultSchema,
) {}
