import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PartnerGuard } from '../../../../common/guards/partner.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../../common/decorators/response-message.decorator';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { CreateStoreUseCase } from '../../application/use-cases/create-store.use-case';
import { CreateStoreImageUseCase } from '../../application/use-cases/create-store-image.use-case';
import {
    ConfirmStoreImageUseCase,
    ConfirmStoreImageResponseDto,
} from '../../application/use-cases/confirm-store-image.use-case';
import { SubmitStoreUseCase } from '../../application/use-cases/submit-store.use-case';
import { ListPartnerStoresUseCase } from '../../application/use-cases/list-partner-stores.use-case';
import { GetPartnerStoreDetailUseCase } from '../../application/use-cases/get-partner-store-detail.use-case';
import { ListPartnerStoreProgramsUseCase } from '../../application/use-cases/list-partner-store-programs.use-case';
import { UpdateStoreUseCase } from '../../application/use-cases/update-store.use-case';
import { DeleteStoreImageUseCase } from '../../application/use-cases/delete-store-image.use-case';
import { CreateStoreDto, CreateStoreResponseDto } from '../dto/create-store.dto';
import { CreateStoreImageDto, CreateStoreImageResponseDto } from '../dto/store-image.dto';
import { SubmitStoreResponseDto } from '../dto/submit-store.dto';
import { ListPartnerStoresResponseDto } from '../dto/list-partner-stores.dto';
import { GetPartnerStoreDetailResponseDto } from '../dto/get-partner-store-detail.dto';
import { ListPartnerStoreProgramsResponseDto } from '../dto/list-partner-store-programs.dto';
import { UpdateStoreDto, UpdateStoreResponseDto } from '../dto/update-store.dto';

@ApiTags('stores')
@ApiBearerAuth()
@Controller()
export class StoreController {
    constructor(
        private readonly createStoreUseCase: CreateStoreUseCase,
        private readonly createStoreImageUseCase: CreateStoreImageUseCase,
        private readonly confirmStoreImageUseCase: ConfirmStoreImageUseCase,
        private readonly submitStoreUseCase: SubmitStoreUseCase,
        private readonly listPartnerStoresUseCase: ListPartnerStoresUseCase,
        private readonly getPartnerStoreDetailUseCase: GetPartnerStoreDetailUseCase,
        private readonly listPartnerStoreProgramsUseCase: ListPartnerStoreProgramsUseCase,
        private readonly updateStoreUseCase: UpdateStoreUseCase,
        private readonly deleteStoreImageUseCase: DeleteStoreImageUseCase,
    ) {}

    @Get('partner/stores')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('내 공방 목록이 성공적으로 조회되었습니다.')
    @ApiOkResponse({ description: '내 공방 목록 조회 성공', type: ListPartnerStoresResponseDto })
    async listPartnerStores(
        @CurrentUser() user: RequestUser,
    ): Promise<ListPartnerStoresResponseDto> {
        return this.listPartnerStoresUseCase.execute(user.id);
    }

    @Get('partner/stores/:storeId/programs')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('운영 클래스 목록이 성공적으로 조회되었습니다.')
    @ApiOkResponse({
        description: '운영 클래스 목록 조회 성공',
        type: ListPartnerStoreProgramsResponseDto,
    })
    async listPartnerStorePrograms(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
    ): Promise<ListPartnerStoreProgramsResponseDto> {
        return this.listPartnerStoreProgramsUseCase.execute(user.id, storeId);
    }

    @Get('partner/stores/:storeId')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('공방 상세 정보가 성공적으로 조회되었습니다.')
    @ApiOkResponse({
        description: '내 공방 상세 조회 성공',
        type: GetPartnerStoreDetailResponseDto,
    })
    async getPartnerStoreDetail(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
    ): Promise<GetPartnerStoreDetailResponseDto> {
        return this.getPartnerStoreDetailUseCase.execute(user.id, storeId);
    }

    @Patch('partner/stores/:storeId')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('공방 정보가 성공적으로 수정되었습니다.')
    @ApiOkResponse({ description: '공방 정보 수정 성공', type: UpdateStoreResponseDto })
    async updateStore(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Body() dto: UpdateStoreDto,
    ): Promise<UpdateStoreResponseDto> {
        return this.updateStoreUseCase.execute(user.id, storeId, dto);
    }

    @Post('stores')
    @UseGuards(AuthGuard)
    @ResponseMessage('공방이 성공적으로 등록되었습니다. 제출 후 검수를 진행해주세요.')
    @ApiCreatedResponse({ description: '공방 초안 생성 성공', type: CreateStoreResponseDto })
    async createStore(
        @CurrentUser() user: RequestUser,
        @Body() dto: CreateStoreDto,
    ): Promise<CreateStoreResponseDto> {
        return this.createStoreUseCase.execute(user.id, dto);
    }

    @Post('partner/stores/:storeId/images')
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage(
        'Pre-signed URL이 성공적으로 발급되었습니다. 5분 이내에 업로드를 완료해주세요.',
    )
    @ApiCreatedResponse({
        description: '공방 이미지 presigned URL 발급 성공',
        type: CreateStoreImageResponseDto,
    })
    async createStoreImage(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Body() dto: CreateStoreImageDto,
    ): Promise<CreateStoreImageResponseDto> {
        return this.createStoreImageUseCase.execute(user.id, storeId, dto);
    }

    @Patch('partner/stores/:storeId/images/:imageId/confirm')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('이미지 업로드가 확인되었습니다.')
    @ApiOkResponse({ description: '공방 이미지 업로드 확인 성공' })
    async confirmStoreImage(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Param('imageId') imageId: string,
    ): Promise<ConfirmStoreImageResponseDto> {
        return this.confirmStoreImageUseCase.execute(user.id, storeId, imageId);
    }

    @Delete('partner/stores/:storeId/images/:imageId')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('이미지가 성공적으로 삭제되었습니다.')
    @ApiOkResponse({ description: '공방 이미지 삭제 성공' })
    async deleteStoreImage(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Param('imageId') imageId: string,
    ): Promise<void> {
        await this.deleteStoreImageUseCase.execute(user.id, storeId, imageId);
    }

    @Post('partner/stores/:storeId/submit')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('공방 검수 신청이 완료되었습니다. 검수 결과를 기다려 주세요.')
    @ApiOkResponse({ description: '공방 심사 제출 성공', type: SubmitStoreResponseDto })
    async submitStore(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
    ): Promise<SubmitStoreResponseDto> {
        return this.submitStoreUseCase.execute(user.id, storeId);
    }
}
