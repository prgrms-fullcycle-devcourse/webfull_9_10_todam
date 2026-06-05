import { ApiProperty } from '@nestjs/swagger';

export class ConfirmStoreImageDto {
    @ApiProperty() id!: string;
    @ApiProperty() status!: string;
}

export class ConfirmStoreImageResponseDto {
    @ApiProperty({ type: ConfirmStoreImageDto })
    image!: ConfirmStoreImageDto;
}
