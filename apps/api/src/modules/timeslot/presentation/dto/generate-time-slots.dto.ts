import { ApiProperty } from '@nestjs/swagger';
import { generateTimeSlotsRequestSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class GenerateTimeSlotsDto extends createZodDto(generateTimeSlotsRequestSchema) {}

export class GeneratedSlotDto {
    @ApiProperty() slotId!: string;
    @ApiProperty() startAt!: string;
    @ApiProperty() endAt!: string;
    @ApiProperty() status!: string;
    @ApiProperty() reservedCount!: number;
}

export class GenerateTimeSlotsResponseDto {
    @ApiProperty() createdCount!: number;
    @ApiProperty({ description: '영업시간/요일/interval 변경으로 삭제된 미래 빈 슬롯 수' })
    removedCount!: number;
    @ApiProperty() skippedCount!: number;
    @ApiProperty({ type: [GeneratedSlotDto] }) createdSlots!: GeneratedSlotDto[];
}
