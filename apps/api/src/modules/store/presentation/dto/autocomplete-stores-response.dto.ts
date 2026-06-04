import { ApiProperty } from '@nestjs/swagger';

// 자동완성 suggestion 항목. type 에 따라 id/subtitle 의미가 달라진다.
export class StoreSuggestionDto {
    @ApiProperty({
        example: 'REGION',
        enum: ['REGION', 'PROGRAM', 'STORE'],
        description: 'REGION | PROGRAM | STORE',
    })
    type!: 'REGION' | 'PROGRAM' | 'STORE';

    @ApiProperty({
        example: 'seongsu-dong',
        description: 'Store/Program ID. REGION은 지역 식별자(regionSigungu+regionDong 조합)',
    })
    id!: string;

    @ApiProperty({ example: '성수동', description: '표시 문구(동명/프로그램명/공방명)' })
    text!: string;

    @ApiProperty({
        example: '서울 성동구 성수동',
        nullable: true,
        description: 'REGION·STORE의 지역 표기. PROGRAM은 null',
    })
    subtitle!: string | null;
}

export class AutocompleteStoresResponseDto {
    @ApiProperty({ type: [StoreSuggestionDto] })
    suggestions!: StoreSuggestionDto[];
}
