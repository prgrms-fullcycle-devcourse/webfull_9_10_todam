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
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PartnerGuard } from '../../../../common/guards/partner.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../../common/decorators/response-message.decorator';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { CreateStoreUseCase } from '../../application/use-cases/create-store.use-case';
import { CreateStoreImageUseCase } from '../../application/use-cases/create-store-image.use-case';
import { CreateBusinessDocumentImageUseCase } from '../../application/use-cases/create-business-document-image.use-case';
import {
    ConfirmStoreImageUseCase,
    ConfirmStoreImageResponseDto,
} from '../../application/use-cases/confirm-store-image.use-case';
import { SubmitStoreUseCase } from '../../application/use-cases/submit-store.use-case';
import { ListPartnerStoresUseCase } from '../../application/use-cases/list-partner-stores.use-case';
import { GetPartnerStoreDetailUseCase } from '../../application/use-cases/get-partner-store-detail.use-case';
import { GetPartnerOnboardingUseCase } from '../../application/use-cases/get-partner-onboarding.use-case';
import { UpdateStoreUseCase } from '../../application/use-cases/update-store.use-case';
import { UpdateBusinessDocumentUseCase } from '../../application/use-cases/update-business-document.use-case';
import { DeleteStoreImageUseCase } from '../../application/use-cases/delete-store-image.use-case';
import { ListStoresUseCase } from '../../application/use-cases/list-stores.use-case';
import { AutocompleteStoresUseCase } from '../../application/use-cases/autocomplete-stores.use-case';
import { GetSlugAvailabilityUseCase } from '../../application/use-cases/get-slug-availability.use-case';
import { ListStoresQueryDto } from '../dto/list-stores.dto';
import { ListStoresResponseDto } from '../dto/list-stores-response.dto';
import { AutocompleteStoresResponseDto } from '../dto/autocomplete-stores-response.dto';
import {
    SlugAvailabilityQueryDto,
    SlugAvailabilityResponseDto,
} from '../dto/slug-availability.dto';
import { ListStoresQueryPipe } from '../pipes/list-stores-query.pipe';
import { CreateStoreDto, CreateStoreResponseDto } from '../dto/create-store.dto';
import { CreateStoreImageDto, CreateStoreImageResponseDto } from '../dto/store-image.dto';
import {
    CreateBusinessDocumentImageDto,
    CreateBusinessDocumentImageResponseDto,
} from '../dto/business-document-image.dto';
import { SubmitStoreResponseDto } from '../dto/submit-store.dto';
import { ListPartnerStoresResponseDto } from '../dto/list-partner-stores.dto';
import { GetPartnerStoreDetailResponseDto } from '../dto/get-partner-store-detail.dto';
import { GetPartnerOnboardingResponseDto } from '../dto/get-partner-onboarding.dto';
import { UpdateStoreDto, UpdateStoreResponseDto } from '../dto/update-store.dto';
import {
    UpdateBusinessDocumentDto,
    UpdateBusinessDocumentResponseDto,
} from '../dto/update-business-document.dto';

@ApiTags('stores')
@ApiBearerAuth()
@Controller()
export class StoreController {
    constructor(
        private readonly createStoreUseCase: CreateStoreUseCase,
        private readonly createStoreImageUseCase: CreateStoreImageUseCase,
        private readonly createBusinessDocumentImageUseCase: CreateBusinessDocumentImageUseCase,
        private readonly confirmStoreImageUseCase: ConfirmStoreImageUseCase,
        private readonly submitStoreUseCase: SubmitStoreUseCase,
        private readonly listPartnerStoresUseCase: ListPartnerStoresUseCase,
        private readonly getPartnerStoreDetailUseCase: GetPartnerStoreDetailUseCase,
        private readonly getPartnerOnboardingUseCase: GetPartnerOnboardingUseCase,
        private readonly updateStoreUseCase: UpdateStoreUseCase,
        private readonly updateBusinessDocumentUseCase: UpdateBusinessDocumentUseCase,
        private readonly deleteStoreImageUseCase: DeleteStoreImageUseCase,
        private readonly listStoresUseCase: ListStoresUseCase,
        private readonly autocompleteStoresUseCase: AutocompleteStoresUseCase,
        private readonly getSlugAvailabilityUseCase: GetSlugAvailabilityUseCase,
    ) {}

    @Get('stores')
    @HttpCode(HttpStatus.OK)
    @ResponseMessage('공방 목록이 성공적으로 탐색되었습니다.')
    @ApiOkResponse({ description: '공방 목록 탐색 성공', type: ListStoresResponseDto })
    async listStores(
        @Query(ListStoresQueryPipe) query: ListStoresQueryDto,
    ): Promise<ListStoresResponseDto> {
        return this.listStoresUseCase.execute(query);
    }

    @Get('stores/search/autocomplete')
    @HttpCode(HttpStatus.OK)
    @ResponseMessage('자동완성 목록 조회가 완료되었습니다.')
    @ApiQuery({
        name: 'keyword',
        required: true,
        description: '입력 중인 검색어(필수, 공백 불가).',
        example: '성수',
    })
    @ApiOkResponse({ description: '자동완성 목록 조회 성공', type: AutocompleteStoresResponseDto })
    async autocompleteStores(
        @Query('keyword') keyword?: string,
    ): Promise<AutocompleteStoresResponseDto> {
        return this.autocompleteStoresUseCase.execute(keyword);
    }

    // 정적 라우트. 동적 세그먼트(:storeId 등)에 가려지지 않도록 static stores/* 라우트들 사이에 배치.
    @Get('stores/slug-availability')
    @HttpCode(HttpStatus.OK)
    // AuthGuard 만 (PartnerGuard 없음). 첫 등록 USER도 사전 중복확인이 가능해야 함 (POST /stores 가드 정책과 동일).
    @UseGuards(AuthGuard)
    @ResponseMessage('slug 사용 가능 여부를 확인했습니다.')
    @ApiQuery({
        name: 'slug',
        required: true,
        description: '중복 확인할 공방 URL slug (영문 소문자·숫자·하이픈, 4~40자).',
        example: 'my-workshop',
    })
    @ApiQuery({
        name: 'excludeStoreId',
        required: false,
        description: '수정 화면에서 자기 자신 store를 충돌 검사에서 제외하기 위한 store id.',
    })
    @ApiOkResponse({
        description: 'slug 사용 가능 여부 확인 성공',
        type: SlugAvailabilityResponseDto,
    })
    async getSlugAvailability(
        @CurrentUser() user: RequestUser,
        @Query() query: SlugAvailabilityQueryDto,
    ): Promise<SlugAvailabilityResponseDto> {
        return this.getSlugAvailabilityUseCase.execute(user.id, query.slug, query.excludeStoreId);
    }

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

    @Get('partner/onboarding')
    @HttpCode(HttpStatus.OK)
    // 무파트너/PENDING/REJECTED 도 자기 온보딩 상태 조회 가능해야 함 → AuthGuard 만(PartnerGuard 금지).
    @UseGuards(AuthGuard)
    @ResponseMessage('온보딩 상태를 조회했습니다.')
    @ApiOkResponse({
        description: '온보딩 상태 조회 성공',
        type: GetPartnerOnboardingResponseDto,
    })
    async getPartnerOnboarding(
        @CurrentUser() user: RequestUser,
    ): Promise<GetPartnerOnboardingResponseDto> {
        return this.getPartnerOnboardingUseCase.execute(user.id);
    }

    @Get('partner/stores/:storeId')
    @HttpCode(HttpStatus.OK)
    // 첫 공방 등록(partner=PENDING)도 검수중 화면에서 자기 공방 조회 가능해야 함. 소유권은 use-case 에서 검증.
    @UseGuards(AuthGuard)
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

    @Patch('partner/stores/:storeId/business-document')
    @HttpCode(HttpStatus.OK)
    // 반려(REJECTED) 파트너는 PENDING/REJECTED 라 PartnerGuard(APPROVED) 통과 못함 → AuthGuard 만. 소유권은 use-case 에서 검증.
    @UseGuards(AuthGuard)
    @ResponseMessage('사업자 정보가 수정되어 재심사를 신청했습니다.')
    @ApiOkResponse({
        description: '사업자 정보 수정 및 재심사 전이 성공',
        type: UpdateBusinessDocumentResponseDto,
    })
    async updateBusinessDocument(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Body() dto: UpdateBusinessDocumentDto,
    ): Promise<UpdateBusinessDocumentResponseDto> {
        return this.updateBusinessDocumentUseCase.execute(user.id, storeId, dto);
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

    @Post('partner/business-documents/images')
    // store-비종속. 첫 등록 USER(partner=PENDING 또는 미생성)도 사용해야 하므로 AuthGuard만.
    @UseGuards(AuthGuard)
    @ResponseMessage(
        'Pre-signed URL이 성공적으로 발급되었습니다. 5분 이내에 업로드를 완료해주세요.',
    )
    @ApiCreatedResponse({
        description: '사업자등록증 presigned URL 발급 성공',
        type: CreateBusinessDocumentImageResponseDto,
    })
    async createBusinessDocumentImage(
        @CurrentUser() user: RequestUser,
        @Body() dto: CreateBusinessDocumentImageDto,
    ): Promise<CreateBusinessDocumentImageResponseDto> {
        return this.createBusinessDocumentImageUseCase.execute(user.id, dto);
    }

    @Post('partner/stores/:storeId/images')
    // 첫 공방 등록(partner=PENDING)도 이미지 업로드 가능해야 함. 소유권은 use-case 에서 검증.
    @UseGuards(AuthGuard)
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
    // 첫 공방 등록(partner=PENDING)도 업로드 확인 가능해야 함. 소유권은 use-case 에서 검증.
    @UseGuards(AuthGuard)
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
