import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Patch,
    Res,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
    patchNotificationSettingsAllFieldsBodySchema,
    updateMyProfileBodySchema,
    withdrawBodySchema,
    type PatchNotificationSettingsAllFieldsBody,
    type UpdateMyProfileBody,
    type WithdrawBody,
} from '@todam/shared';
import type { Response } from 'express';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { BodyZodValidationPipe } from '../../../../common/pipes/body-zod-validation.pipe';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../../common/decorators/response-message.decorator';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { GetMyProfileUseCase } from '../../application/use-cases/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from '../../application/use-cases/update-my-profile.use-case';
import { WithdrawUseCase } from '../../application/use-cases/withdraw.use-case';
import { GetNotificationSettingsUseCase } from '../../application/use-cases/get-notification-settings.use-case';
import { PatchNotificationSettingsUseCase } from '../../application/use-cases/patch-notification-settings.use-case';
import {
    GetMyProfileResponseDto,
    UpdateMyProfileDto,
    UpdateMyProfileResponseDto,
} from '../dto/user-me.dto';
import { WithdrawDto } from '../dto/withdraw.dto';
import {
    GetNotificationSettingsResponseDto,
    PatchNotificationSettingsBodyDto,
    PatchNotificationSettingsResponseDto,
} from '../dto/notification-settings.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller()
export class UserController {
    constructor(
        private readonly getMyProfile: GetMyProfileUseCase,
        private readonly updateMyProfile: UpdateMyProfileUseCase,
        private readonly withdrawUseCase: WithdrawUseCase,
        private readonly getNotificationSettings: GetNotificationSettingsUseCase,
        private readonly patchNotificationSettings: PatchNotificationSettingsUseCase,
    ) {}

    @Get('users/me')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('내 프로필이 성공적으로 조회되었습니다.')
    @ApiOkResponse({ type: GetMyProfileResponseDto })
    async getProfile(@CurrentUser() user: RequestUser): Promise<GetMyProfileResponseDto> {
        return this.getMyProfile.execute(user.id);
    }

    @Patch('users/me')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('내 프로필이 성공적으로 수정되었습니다.')
    @ApiOkResponse({ type: UpdateMyProfileResponseDto })
    @ApiBody({ type: UpdateMyProfileDto })
    async patchProfile(
        @CurrentUser() user: RequestUser,
        @Body(new BodyZodValidationPipe(updateMyProfileBodySchema))
        dto: UpdateMyProfileBody,
    ): Promise<UpdateMyProfileResponseDto> {
        return this.updateMyProfile.execute(user.id, dto.nickname);
    }

    @Delete('users/me')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('회원 탈퇴가 정상적으로 처리되었습니다.')
    @ApiOkResponse({ description: '회원 탈퇴 성공' })
    @ApiBody({ type: WithdrawDto })
    async withdraw(
        @CurrentUser() user: RequestUser,
        @Body(new BodyZodValidationPipe(withdrawBodySchema)) dto: WithdrawBody,
        @Res({ passthrough: true }) res: Response,
    ): Promise<null> {
        await this.withdrawUseCase.execute(user.id, dto);

        // 로그아웃 패턴과 동일 옵션으로 refresh_token 쿠키 만료
        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: process.env['NODE_ENV'] === 'production',
            sameSite: 'strict',
            path: '/',
        });

        return null;
    }

    // ─── 알림 설정 ─────────────────────────────────────────────────────────────

    /**
     * GET /users/me/notification-settings
     * 내 알림 설정 조회. 레코드 없으면 기본값 생성 후 반환(lazy-default).
     */
    @Get('users/me/notification-settings')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('알림 설정이 성공적으로 조회되었습니다.')
    @ApiOkResponse({ type: GetNotificationSettingsResponseDto })
    async getNotificationSettingsHandler(
        @CurrentUser() user: RequestUser,
    ): Promise<GetNotificationSettingsResponseDto> {
        return this.getNotificationSettings.execute(user.id);
    }

    /**
     * PATCH /users/me/notification-settings
     * 알림 설정 partial 업데이트. 빈 객체는 no-op(현재 설정 반환).
     * 레코드 없으면 기본값 생성 후 적용.
     */
    @Patch('users/me/notification-settings')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('알림 설정이 성공적으로 업데이트되었습니다.')
    @ApiOkResponse({ type: PatchNotificationSettingsResponseDto })
    @ApiBody({ type: PatchNotificationSettingsBodyDto })
    async patchNotificationSettingsHandler(
        @CurrentUser() user: RequestUser,
        @Body(new BodyZodValidationPipe(patchNotificationSettingsAllFieldsBodySchema))
        dto: PatchNotificationSettingsAllFieldsBody,
    ): Promise<PatchNotificationSettingsResponseDto> {
        return this.patchNotificationSettings.execute(user.id, dto);
    }
}
