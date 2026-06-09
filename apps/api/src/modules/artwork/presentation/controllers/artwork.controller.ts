import { Controller, Get, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../../common/decorators/response-message.decorator';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { GetArtworkDetailUseCase } from '../../application/use-cases/get-artwork-detail.use-case';
import { ArtworkDetailResponseDto } from '../dto/artwork-detail.dto';

@ApiTags('artworks')
@ApiBearerAuth()
@Controller()
export class ArtworkController {
    constructor(private readonly getArtworkDetail: GetArtworkDetailUseCase) {}

    @Get('artworks/:artworkId')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('작품 제작 단계가 성공적으로 조회되었습니다.')
    @ApiOkResponse({ type: ArtworkDetailResponseDto })
    @ApiParam({ name: 'artworkId', type: String, description: 'UUID' })
    async getDetail(
        @CurrentUser() user: RequestUser,
        @Param('artworkId') artworkId: string,
    ): Promise<ArtworkDetailResponseDto> {
        return this.getArtworkDetail.execute(user.id, artworkId);
    }
}
