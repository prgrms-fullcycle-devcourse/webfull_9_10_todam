import { confirmStoreImageResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 응답 SSOT = @todam/shared(zod). 공방 이미지 업로드 확정 응답.
export class ConfirmStoreImageResponseDto extends createZodDto(confirmStoreImageResultSchema) {}
