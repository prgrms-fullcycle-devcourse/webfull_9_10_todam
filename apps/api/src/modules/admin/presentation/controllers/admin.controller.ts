import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
    adminLoginRequestSchema,
    adminStoreListQuerySchema,
    adminStoreRejectRequestSchema,
    adminStoreSuspendRequestSchema,
} from '@todam/shared';
import type {
    AdminLoginRequest,
    AdminLoginResponse,
    AdminStoreActionResponse,
    AdminStoreDetailResponse,
    AdminStoreListQuery,
    AdminStoreListResponse,
    AdminStoreRejectRequest,
    AdminStoreSuspendRequest,
} from '@todam/shared';
import type { Request } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';
import { AdminLoginUseCase } from '../../application/use-cases/admin-login.use-case';
import {
    ApproveStoreUseCase,
    GetAdminStoreDetailUseCase,
    ListAdminStoresUseCase,
    RejectStoreUseCase,
    RestoreStoreUseCase,
    SuspendStoreUseCase,
} from '../../application/use-cases/admin-store.use-cases';
import { AdminGuard } from '../guards/admin.guard';
import { ResponseMessage } from '../../../../common/decorators/response-message.decorator';
import {
    AdminLoginRequestDto,
    AdminLoginResponseDto,
    AdminStoreRejectRequestDto,
    AdminStoreSuspendRequestDto,
} from '../dto/admin.dto';
import { AdminStoreRejectValidationPipe } from '../pipes/admin-store-reject-validation.pipe';

type AdminRequest = Request & { user: { id: string; type: 'admin' } };
const storeIdPipe = new ParseUUIDPipe({ version: '4' });

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
    constructor(
        private readonly loginUseCase: AdminLoginUseCase,
        private readonly listStoresUseCase: ListAdminStoresUseCase,
        private readonly getStoreDetailUseCase: GetAdminStoreDetailUseCase,
        private readonly approveStoreUseCase: ApproveStoreUseCase,
        private readonly rejectStoreUseCase: RejectStoreUseCase,
        private readonly suspendStoreUseCase: SuspendStoreUseCase,
        private readonly restoreStoreUseCase: RestoreStoreUseCase,
    ) {}

    @Post('auth/login')
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: AdminLoginRequestDto })
    @ApiOkResponse({ type: AdminLoginResponseDto })
    @ResponseMessage('어드민 로그인이 완료되었습니다.')
    login(
        @Body(new ZodValidationPipe(adminLoginRequestSchema)) dto: AdminLoginRequest,
    ): Promise<AdminLoginResponse> {
        return this.loginUseCase.execute(dto);
    }

    @Get('stores')
    @UseGuards(AdminGuard)
    @ApiBearerAuth()
    listStores(
        @Query(new ZodValidationPipe(adminStoreListQuerySchema)) query: AdminStoreListQuery,
    ): Promise<AdminStoreListResponse> {
        return this.listStoresUseCase.execute(query);
    }

    @Get('stores/:storeId')
    @UseGuards(AdminGuard)
    @ApiBearerAuth()
    getStoreDetail(
        @Param('storeId', storeIdPipe) storeId: string,
    ): Promise<AdminStoreDetailResponse> {
        return this.getStoreDetailUseCase.execute(storeId);
    }

    @Patch('stores/:storeId/approve')
    @UseGuards(AdminGuard)
    @ApiBearerAuth()
    approve(
        @Req() req: AdminRequest,
        @Param('storeId', storeIdPipe) storeId: string,
    ): Promise<AdminStoreActionResponse> {
        return this.approveStoreUseCase.execute(req.user.id, storeId);
    }

    @Patch('stores/:storeId/reject')
    @UseGuards(AdminGuard)
    @ApiBearerAuth()
    @ApiBody({ type: AdminStoreRejectRequestDto })
    reject(
        @Req() req: AdminRequest,
        @Param('storeId', storeIdPipe) storeId: string,
        @Body(new AdminStoreRejectValidationPipe(adminStoreRejectRequestSchema))
        dto: AdminStoreRejectRequest,
    ): Promise<AdminStoreActionResponse> {
        return this.rejectStoreUseCase.execute(req.user.id, storeId, dto);
    }

    @Patch('stores/:storeId/suspend')
    @UseGuards(AdminGuard)
    @ApiBearerAuth()
    @ApiBody({ type: AdminStoreSuspendRequestDto })
    suspend(
        @Req() req: AdminRequest,
        @Param('storeId', storeIdPipe) storeId: string,
        @Body(new ZodValidationPipe(adminStoreSuspendRequestSchema)) dto: AdminStoreSuspendRequest,
    ): Promise<AdminStoreActionResponse> {
        return this.suspendStoreUseCase.execute(req.user.id, storeId, dto);
    }

    @Patch('stores/:storeId/restore')
    @UseGuards(AdminGuard)
    @ApiBearerAuth()
    restore(
        @Req() req: AdminRequest,
        @Param('storeId', storeIdPipe) storeId: string,
    ): Promise<AdminStoreActionResponse> {
        return this.restoreStoreUseCase.execute(req.user.id, storeId);
    }
}
