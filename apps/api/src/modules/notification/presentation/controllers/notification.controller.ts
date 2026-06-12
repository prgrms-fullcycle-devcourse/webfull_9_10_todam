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
    ApiBody,
    ApiNoContentResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    getNotificationsQuerySchema,
    registerNotificationTokenBodySchema,
    type GetNotificationsQuery,
    type RegisterNotificationTokenBody,
} from '@todam/shared';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { BodyZodValidationPipe } from '../../../../common/pipes/body-zod-validation.pipe';
import { QueryZodValidationPipe } from '../../../../common/pipes/query-zod-validation.pipe';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../../common/decorators/response-message.decorator';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { RegisterNotificationTokenUseCase } from '../../application/use-cases/register-notification-token.use-case';
import { RevokeNotificationTokenUseCase } from '../../application/use-cases/revoke-notification-token.use-case';
import { GetNotificationsUseCase } from '../../application/use-cases/get-notifications.use-case';
import { ReadNotificationUseCase } from '../../application/use-cases/read-notification.use-case';
import { ReadAllNotificationsUseCase } from '../../application/use-cases/read-all-notifications.use-case';
import {
    RegisterNotificationTokenBodyDto,
    RegisterNotificationTokenResponseDto,
} from '../dto/notification-token.dto';
import {
    GetNotificationsResponseDto,
    ReadNotificationResponseDto,
    ReadAllNotificationsResponseDto,
} from '../dto/notification.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
    constructor(
        private readonly registerToken: RegisterNotificationTokenUseCase,
        private readonly revokeToken: RevokeNotificationTokenUseCase,
        private readonly getNotifications: GetNotificationsUseCase,
        private readonly readNotification: ReadNotificationUseCase,
        private readonly readAllNotifications: ReadAllNotificationsUseCase,
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
        dto: RegisterNotificationTokenBody,
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

    /**
     * GET /notifications
     * 인앱 알림센터 — 본인 알림 커서 페이지네이션 목록.
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('알림 목록을 조회했습니다.')
    @ApiOkResponse({ type: GetNotificationsResponseDto })
    async listNotifications(
        @CurrentUser() user: RequestUser,
        @Query(new QueryZodValidationPipe(getNotificationsQuerySchema))
        query: GetNotificationsQuery,
    ): Promise<GetNotificationsResponseDto> {
        return this.getNotifications.execute({
            userId: user.id,
            cursor: query.cursor,
            limit: query.limit,
            unreadOnly: query.unreadOnly,
        });
    }

    /**
     * PATCH /notifications/read-all
     * 본인 미읽음 전체 readAt 일괄 갱신.
     * NOTE: `:id/read` 보다 먼저 선언해야 NestJS 라우터가 올바르게 매칭.
     */
    @Patch('read-all')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('모든 알림을 읽음 처리했습니다.')
    @ApiOkResponse({ type: ReadAllNotificationsResponseDto })
    async readAllNotificationsHandler(
        @CurrentUser() user: RequestUser,
    ): Promise<ReadAllNotificationsResponseDto> {
        return this.readAllNotifications.execute({ userId: user.id });
    }

    /**
     * PATCH /notifications/:id/read
     * 단건 읽음 처리 — readAt = now(). 타인 알림 접근 시 403.
     */
    @Patch(':id/read')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('알림을 읽음 처리했습니다.')
    @ApiOkResponse({ type: ReadNotificationResponseDto })
    async readNotificationHandler(
        @CurrentUser() user: RequestUser,
        @Param('id') id: string,
    ): Promise<ReadNotificationResponseDto> {
        return this.readNotification.execute({
            notificationId: id,
            userId: user.id,
        });
    }
}
