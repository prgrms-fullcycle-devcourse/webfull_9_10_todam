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
    @ApiProperty({
        description:
            '새 격자에서 벗어났지만 활성 예약이 있어 CLOSED로 전환된 슬롯 수(신규 예약 차단, 기존 예약 보존)',
    })
    closedCount!: number;
    @ApiProperty() skippedCount!: number;
    @ApiProperty({ type: [GeneratedSlotDto] }) createdSlots!: GeneratedSlotDto[];
}
