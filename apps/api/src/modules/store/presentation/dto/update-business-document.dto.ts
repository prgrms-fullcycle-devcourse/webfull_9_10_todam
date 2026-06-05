import { ApiProperty } from '@nestjs/swagger';
import { businessDocumentUpdateRequestSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 반려(REJECTED) 공방 재수정용. 변경 필드만 부분 갱신. 저장 시 재심사(REJECTED→PENDING) 전이.
// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class UpdateBusinessDocumentDto extends createZodDto(businessDocumentUpdateRequestSchema) {}

export class UpdateBusinessDocumentResultStoreDto {
    @ApiProperty() id!: string;
    @ApiProperty() status!: string;
    @ApiProperty() updatedAt!: string;
}

export class UpdateBusinessDocumentResponseDto {
    @ApiProperty({ type: UpdateBusinessDocumentResultStoreDto })
    store!: UpdateBusinessDocumentResultStoreDto;
}
