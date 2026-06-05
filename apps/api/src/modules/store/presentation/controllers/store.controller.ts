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
import { OptionalAuthGuard } from '../../../../common/guards/optional-auth.guard';
import { PartnerGuard } from '../../../../common/guards/partner.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../../common/decorators/response-message.decorator';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { CreateStoreUseCase } from '../../application/use-cases/create-store.use-case';
import { CreateStoreImageUseCase } from '../../application/use-cases/create-store-image.use-case';
import { CreateBusinessDocumentImageUseCase } from '../../application/use-cases/create-business-document-image.use-case';
import { ConfirmStoreImageUseCase } from '../../application/use-cases/confirm-store-image.use-case';
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
import { GetStoreDetailUseCase } from '../../application/use-cases/get-store-detail.use-case';
import { ListStoreProgramsUseCase } from '../../application/use-cases/list-store-programs.use-case';
import { ListStoreReviewsUseCase } from '../../application/use-cases/list-store-reviews.use-case';
import { ToggleFavoriteStoreUseCase } from '../../application/use-cases/toggle-favorite-store.use-case';
import { GetPartnerCurrentStoreUseCase } from '../../application/use-cases/get-partner-current-store.use-case';
import { UpdatePartnerCurrentStoreUseCase } from '../../application/use-cases/update-partner-current-store.use-case';
import { ListStoresQueryDto } from '../dto/list-stores.dto';
import { ListStoresResponseDto } from '../dto/list-stores-response.dto';
import { ListStoreReviewsQueryDto } from '../dto/list-store-reviews.dto';
import { ListStoreReviewsResponseDto } from '../dto/list-store-reviews-response.dto';
import { AutocompleteStoresResponseDto } from '../dto/autocomplete-stores-response.dto';
import {
    SlugAvailabilityQueryDto,
    SlugAvailabilityResponseDto,
} from '../dto/slug-availability.dto';
import { ListStoresQueryPipe } from '../pipes/list-stores-query.pipe';
import { ListStoreReviewsQueryPipe } from '../pipes/list-store-reviews-query.pipe';
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
import { GetStoreDetailResponseDto } from '../dto/get-store-detail.dto';
import { ToggleFavoriteStoreResponseDto } from '../dto/toggle-favorite-store.dto';
import { ListStoreProgramsResponseDto } from '../dto/list-store-programs.dto';
import {
    GetPartnerCurrentStoreResponseDto,
    UpdatePartnerCurrentStoreDto,
    UpdatePartnerCurrentStoreResponseDto,
} from '../dto/partner-current-store.dto';
import { UpdateStoreDto, UpdateStoreResponseDto } from '../dto/update-store.dto';
import {
    UpdateBusinessDocumentDto,
    UpdateBusinessDocumentResponseDto,
} from '../dto/update-business-document.dto';
import { ConfirmStoreImageResponseDto } from '../dto/confirm-store-image.dto';

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
        private readonly getStoreDetailUseCase: GetStoreDetailUseCase,
        private readonly listStoreProgramsUseCase: ListStoreProgramsUseCase,
        private readonly listStoreReviewsUseCase: ListStoreReviewsUseCase,
        private readonly toggleFavoriteStoreUseCase: ToggleFavoriteStoreUseCase,
        private readonly getPartnerCurrentStoreUseCase: GetPartnerCurrentStoreUseCase,
        private readonly updatePartnerCurrentStoreUseCase: UpdatePartnerCurrentStoreUseCase,
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

    // 정적 라우트. 동적 세그먼트(stores/:slug)보다 반드시 먼저 등록해야
    // /stores/slug-availability 요청이 :slug 로 빨려들어가지 않는다.
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

    @Get('stores/:slug')
    @HttpCode(HttpStatus.OK)
    // 퍼블릭(Guest·User 공통). Bearer 가 있으면 isFavorite 에 찜 여부 반영, 없으면 false.
    @UseGuards(OptionalAuthGuard)
    @ResponseMessage('공방 상세 정보가 성공적으로 조회되었습니다.')
    @ApiOkResponse({ description: '공방 상세 조회 성공', type: GetStoreDetailResponseDto })
    async getStoreDetail(
        @Param('slug') slug: string,
        @CurrentUser() user?: RequestUser,
    ): Promise<GetStoreDetailResponseDto> {
        return this.getStoreDetailUseCase.execute(slug, user?.id);
    }

    @Get('stores/:slug/programs')
    @HttpCode(HttpStatus.OK)
    // 퍼블릭. PUBLISHED 공방의 ACTIVE 클래스 목록.
    @ResponseMessage('운영 클래스 목록이 성공적으로 조회되었습니다.')
    @ApiOkResponse({
        description: '운영 클래스 목록 조회 성공',
        type: ListStoreProgramsResponseDto,
    })
    async listStorePrograms(@Param('slug') slug: string): Promise<ListStoreProgramsResponseDto> {
        return this.listStoreProgramsUseCase.execute(slug);
    }

    @Get('stores/:slug/reviews')
    @HttpCode(HttpStatus.OK)
    // 퍼블릭(Guest·User 공통). PUBLISHED 공방의 노출(is_visible=true) 리뷰 목록. 커서 기반.
    @ResponseMessage('공방 리뷰 목록이 성공적으로 조회되었습니다.')
    @ApiOkResponse({ description: '공방 리뷰 목록 조회 성공', type: ListStoreReviewsResponseDto })
    async listStoreReviews(
        @Param('slug') slug: string,
        @Query(ListStoreReviewsQueryPipe) query: ListStoreReviewsQueryDto,
    ): Promise<ListStoreReviewsResponseDto> {
        return this.listStoreReviewsUseCase.execute(slug, query);
    }

    @Get('partner/me/current-store')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('현재 접속 공방 정보가 조회되었습니다.')
    @ApiOkResponse({
        description: '마지막 접속 공방 + 소유 공방 목록 조회 성공',
        type: GetPartnerCurrentStoreResponseDto,
    })
    async getPartnerCurrentStore(
        @CurrentUser() user: RequestUser,
    ): Promise<GetPartnerCurrentStoreResponseDto> {
        return this.getPartnerCurrentStoreUseCase.execute(user.id);
    }

    @Patch('partner/me/current-store')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('접속 공방이 전환되었습니다.')
    @ApiOkResponse({
        description: '마지막 접속 공방 갱신 성공',
        type: UpdatePartnerCurrentStoreResponseDto,
    })
    async updatePartnerCurrentStore(
        @CurrentUser() user: RequestUser,
        @Body() dto: UpdatePartnerCurrentStoreDto,
    ): Promise<UpdatePartnerCurrentStoreResponseDto> {
        return this.updatePartnerCurrentStoreUseCase.execute(user.id, dto.storeId);
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
    @ApiOkResponse({
        description: '공방 이미지 업로드 확인 성공',
        type: ConfirmStoreImageResponseDto,
    })
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

    @Post('stores/:storeId/favorite')
    @HttpCode(HttpStatus.OK)
    // 찜 등록/해제 토글. User 이상 인증 필수(미인증 401 UNAUTHORIZED).
    // PUBLISHED 공방만 찜 가능(비존재/비공개 404 STORE_NOT_FOUND). Request body 없음.
    @UseGuards(AuthGuard)
    @ResponseMessage('찜 상태가 변경되었습니다.')
    @ApiOkResponse({ description: '공방 찜 등록/해제 성공', type: ToggleFavoriteStoreResponseDto })
    async toggleFavoriteStore(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
    ): Promise<ToggleFavoriteStoreResponseDto> {
        return this.toggleFavoriteStoreUseCase.execute(user.id, storeId);
    }
}
