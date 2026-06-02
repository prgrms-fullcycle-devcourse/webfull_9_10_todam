import {
    Body,
    Controller,
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

@ApiTags('programs')
@ApiBearerAuth()
@Controller()
export class ProgramController {
    constructor(
        private readonly createProgramUseCase: CreateProgramUseCase,
        private readonly createProgramImageUseCase: CreateProgramImageUseCase,
        private readonly updateProgramStatusUseCase: UpdateProgramStatusUseCase,
        private readonly confirmProgramImageUseCase: ConfirmProgramImageUseCase,
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
}
