import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PartnerGuard } from '../../../../common/guards/partner.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../../common/decorators/response-message.decorator';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { CreateProgramUseCase } from '../../application/use-cases/create-program.use-case';
import { UpdateProgramUseCase } from '../../application/use-cases/update-program.use-case';
import { DeleteProgramImageUseCase } from '../../application/use-cases/delete-program-image.use-case';
import { GetProgramDetailUseCase } from '../../application/use-cases/get-program-detail.use-case';
import { GetPublicProgramDetailUseCase } from '../../application/use-cases/get-public-program-detail.use-case';
import { ListPartnerStoreProgramsUseCase } from '../../application/use-cases/list-partner-store-programs.use-case';
import { ReorderPartnerStoreProgramsUseCase } from '../../application/use-cases/reorder-partner-store-programs.use-case';
import { CreateProgramImageUseCase } from '../../application/use-cases/create-program-image.use-case';
import { UpdateProgramStatusUseCase } from '../../application/use-cases/update-program-status.use-case';
import {
    ConfirmProgramImageUseCase,
    ConfirmProgramImageResponseDto,
} from '../../application/use-cases/confirm-program-image.use-case';
import { CreateProgramDto, CreateProgramResponseDto } from '../dto/create-program.dto';
import { CreateProgramImageDto, CreateProgramImageResponseDto } from '../dto/program-image.dto';
import {
    UpdateProgramStatusDto,
    UpdateProgramStatusResponseDto,
} from '../dto/update-program-status.dto';
import { UpdateProgramDto, UpdateProgramResponseDto } from '../dto/update-program.dto';
import { GetProgramDetailResponseDto } from '../dto/get-program-detail.dto';
import { ListPartnerStoreProgramsResponseDto } from '../dto/list-partner-store-programs.dto';
import { ReorderPartnerStoreProgramsDto } from '../dto/reorder-partner-store-programs.dto';

@ApiTags('programs')
@ApiBearerAuth()
@Controller()
export class ProgramController {
    constructor(
        private readonly createProgramUseCase: CreateProgramUseCase,
        private readonly updateProgramUseCase: UpdateProgramUseCase,
        private readonly deleteProgramImageUseCase: DeleteProgramImageUseCase,
        private readonly getProgramDetailUseCase: GetProgramDetailUseCase,
        private readonly getPublicProgramDetailUseCase: GetPublicProgramDetailUseCase,
        private readonly createProgramImageUseCase: CreateProgramImageUseCase,
        private readonly updateProgramStatusUseCase: UpdateProgramStatusUseCase,
        private readonly confirmProgramImageUseCase: ConfirmProgramImageUseCase,
        private readonly listPartnerStoreProgramsUseCase: ListPartnerStoreProgramsUseCase,
        private readonly reorderPartnerStoreProgramsUseCase: ReorderPartnerStoreProgramsUseCase,
    ) {}

    @Post('partner/stores/:storeId/programs')
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('프로그램이 성공적으로 등록되었습니다.')
    @ApiCreatedResponse({ description: '클래스 등록 성공', type: CreateProgramResponseDto })
    async createProgram(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Body() dto: CreateProgramDto,
    ): Promise<CreateProgramResponseDto> {
        return this.createProgramUseCase.execute(user.id, storeId, dto);
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

    @Patch('partner/stores/:storeId/programs/order')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('클래스 순서가 성공적으로 변경되었습니다.')
    @ApiOkResponse({
        description: '클래스 순서 변경 성공',
        type: ListPartnerStoreProgramsResponseDto,
    })
    async reorderPartnerStorePrograms(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Body() dto: ReorderPartnerStoreProgramsDto,
    ): Promise<ListPartnerStoreProgramsResponseDto> {
        return this.reorderPartnerStoreProgramsUseCase.execute(user.id, storeId, dto);
    }

    @Get('partner/stores/:storeId/programs/:programId')
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('프로그램 상세 정보가 성공적으로 조회되었습니다.')
    @ApiOkResponse({
        description: '파트너 클래스 상세 조회 성공',
        type: GetProgramDetailResponseDto,
    })
    async getProgramDetail(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Param('programId') programId: string,
    ): Promise<GetProgramDetailResponseDto> {
        return this.getProgramDetailUseCase.execute(user.id, storeId, programId);
    }

    @Get('stores/:slug/programs/:programId')
    @HttpCode(HttpStatus.OK)
    // 퍼블릭 조회(비인증) — ACTIVE 클래스만 노출. 가시성은 use-case 에서 처리.
    @ResponseMessage('클래스 상세 정보가 성공적으로 조회되었습니다.')
    @ApiOkResponse({
        description: '클래스 상세 조회 성공',
        type: GetProgramDetailResponseDto,
    })
    async getPublicProgramDetail(
        @Param('slug') slug: string,
        @Param('programId') programId: string,
    ): Promise<GetProgramDetailResponseDto> {
        return this.getPublicProgramDetailUseCase.execute(slug, programId);
    }

    @Patch('partner/stores/:storeId/programs/:programId')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('프로그램이 성공적으로 수정되었습니다.')
    @ApiOkResponse({
        description: '클래스 정보 수정 성공',
        type: UpdateProgramResponseDto,
    })
    async updateProgram(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Param('programId') programId: string,
        @Body() dto: UpdateProgramDto,
    ): Promise<UpdateProgramResponseDto> {
        return this.updateProgramUseCase.execute(user.id, storeId, programId, dto);
    }

    @Post('partner/stores/:storeId/programs/:programId/images')
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('프로그램 이미지 업로드용 URL이 발급되었습니다.')
    @ApiCreatedResponse({
        description: '클래스 이미지 presigned URL 발급 성공',
        type: CreateProgramImageResponseDto,
    })
    async createProgramImage(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Param('programId') programId: string,
        @Body() dto: CreateProgramImageDto,
    ): Promise<CreateProgramImageResponseDto> {
        return this.createProgramImageUseCase.execute(user.id, storeId, programId, dto);
    }

    @Patch('partner/stores/:storeId/programs/:programId/status')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('프로그램 상태가 성공적으로 변경되었습니다.')
    @ApiOkResponse({
        description: '클래스 상태 변경 성공',
        type: UpdateProgramStatusResponseDto,
    })
    async updateProgramStatus(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Param('programId') programId: string,
        @Body() dto: UpdateProgramStatusDto,
    ): Promise<UpdateProgramStatusResponseDto> {
        return this.updateProgramStatusUseCase.execute(user.id, storeId, programId, dto);
    }

    @Patch('partner/stores/:storeId/programs/:programId/images/:imageId/confirm')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('이미지 업로드가 확인되었습니다.')
    @ApiOkResponse({ description: '클래스 이미지 업로드 확인 성공' })
    async confirmProgramImage(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Param('programId') programId: string,
        @Param('imageId') imageId: string,
    ): Promise<ConfirmProgramImageResponseDto> {
        return this.confirmProgramImageUseCase.execute(user.id, storeId, programId, imageId);
    }

    @Delete('partner/stores/:storeId/programs/:programId/images/:imageId')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('프로그램 이미지가 삭제되었습니다.')
    @ApiOkResponse({ description: '클래스 이미지 삭제 성공' })
    async deleteProgramImage(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Param('programId') programId: string,
        @Param('imageId') imageId: string,
    ): Promise<void> {
        await this.deleteProgramImageUseCase.execute(user.id, storeId, programId, imageId);
    }
}
