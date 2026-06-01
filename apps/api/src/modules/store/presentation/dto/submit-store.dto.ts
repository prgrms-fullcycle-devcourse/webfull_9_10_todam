import { ApiProperty } from '@nestjs/swagger';

export class SubmitStoreResponseStoreDto {
    @ApiProperty() id!: string;
    @ApiProperty() status!: string;
    @ApiProperty() updatedAt!: string;
}

export class SubmitStoreResponseDto {
    @ApiProperty({ type: SubmitStoreResponseStoreDto }) store!: SubmitStoreResponseStoreDto;
}
