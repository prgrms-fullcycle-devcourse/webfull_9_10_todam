import {
    Body,
    Controller,
    Delete,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiNoContentResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger';
import { registerNotificationTokenBodySchema } from '@todam/shared';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { BodyZodValidationPipe } from '../../../../common/pipes/body-zod-validation.pipe';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../../common/decorators/response-message.decorator';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { RegisterNotificationTokenUseCase } from '../../application/use-cases/register-notification-token.use-case';
import { RevokeNotificationTokenUseCase } from '../../application/use-cases/revoke-notification-token.use-case';
import {
    RegisterNotificationTokenBodyDto,
    RegisterNotificationTokenResponseDto,
} from '../dto/notification-token.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
    constructor(
        private readonly registerToken: RegisterNotificationTokenUseCase,
        private readonly revokeToken: RevokeNotificationTokenUseCase,
    ) {}

    /**
     * POST /notifications/tokens
     * FCM 토큰 등록/갱신(upsert).
     * 동일 userId + fcmToken 이면 revokedAt=null 복구 포함한 갱신, 없으면 신규 생성.
     */
    @Post('tokens')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('FCM 토큰이 성공적으로 등록되었습니다.')
    @ApiOkResponse({ type: RegisterNotificationTokenResponseDto })
    @ApiBody({ type: RegisterNotificationTokenBodyDto })
    async registerNotificationToken(
        @CurrentUser() user: RequestUser,
        @Body(new BodyZodValidationPipe(registerNotificationTokenBodySchema))
        dto: RegisterNotificationTokenBodyDto,
    ): Promise<RegisterNotificationTokenResponseDto> {
        return this.registerToken.execute({
            userId: user.id,
            fcmToken: dto.fcmToken,
            userAgent: dto.userAgent,
        });
    }

    /**
     * DELETE /notifications/tokens/:fcmToken
     * 토큰 revoke — revokedAt 기록. 로그아웃 훅에서 호출.
     * 본인 소유 토큰만 revoke 가능. 없으면 404.
     */
    @Delete('tokens/:fcmToken')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(AuthGuard)
    @ApiNoContentResponse({ description: 'FCM 토큰 revoke 성공' })
    async revokeNotificationToken(
        @CurrentUser() user: RequestUser,
        @Param('fcmToken') fcmToken: string,
    ): Promise<void> {
        await this.revokeToken.execute({
            userId: user.id,
            fcmToken,
        });
    }
}
