import {
    Body,
    Controller,
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
    ApiCreatedResponse,
    ApiOkResponse,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { ReservationStatus } from '@prisma/client';
import {
    createUserReservationRequestSchema,
    deliveryEditRequestSchema,
    getMyReservationsQuerySchema,
} from '@todam/shared';
import type {
    CreateUserReservationRequest,
    DeliveryEditRequest,
    GetMyReservationsQuery,
} from '@todam/shared';
import { ZodValidationPipe } from 'nestjs-zod';
import { BodyZodValidationPipe } from '../../../../common/pipes/body-zod-validation.pipe';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../../common/decorators/response-message.decorator';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { CancelUserReservationUseCase } from '../../application/use-cases/cancel-user-reservation.use-case';
import { CreateUserReservationUseCase } from '../../application/use-cases/create-user-reservation.use-case';
import { GetReservationDetailUseCase } from '../../application/use-cases/get-reservation-detail.use-case';
import { ListUserReservationsUseCase } from '../../application/use-cases/list-user-reservations.use-case';
import { UpdateDeliveryUseCase } from '../../application/use-cases/update-delivery.use-case';
import {
    CancelReservationResponseDto,
    CreateUserReservationDto,
    CreateUserReservationResponseDto,
    DeliveryEditResponseDto,
    MyReservationsResponseDto,
    ReservationDetailResponseDto,
} from '../dto/user-reservation.dto';

@ApiTags('reservations')
@ApiBearerAuth()
@Controller()
export class UserReservationController {
    constructor(
        private readonly createUseCase: CreateUserReservationUseCase,
        private readonly listUseCase: ListUserReservationsUseCase,
        private readonly detailUseCase: GetReservationDetailUseCase,
        private readonly cancelUseCase: CancelUserReservationUseCase,
        private readonly updateDeliveryUseCase: UpdateDeliveryUseCase,
    ) {}

    @Get('reservations/me')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('예약 목록이 성공적으로 조회되었습니다.')
    @ApiOkResponse({ type: MyReservationsResponseDto })
    @ApiQuery({ name: 'status', enum: ReservationStatus, required: false })
    @ApiQuery({ name: 'cursor', type: String, required: false })
    @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
    async listMyReservations(
        @CurrentUser() user: RequestUser,
        @Query(new ZodValidationPipe(getMyReservationsQuerySchema))
        query: GetMyReservationsQuery,
    ): Promise<MyReservationsResponseDto> {
        return this.listUseCase.execute(user.id, query);
    }

    @Post('reservations')
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(AuthGuard)
    @ResponseMessage('예약이 성공적으로 접수되었습니다.')
    @ApiCreatedResponse({ type: CreateUserReservationResponseDto })
    @ApiBody({ type: CreateUserReservationDto })
    async create(
        @CurrentUser() user: RequestUser,
        @Body(new ZodValidationPipe(createUserReservationRequestSchema))
        dto: CreateUserReservationRequest,
    ): Promise<CreateUserReservationResponseDto> {
        return this.createUseCase.execute(user.id, dto);
    }

    @Get('reservations/:reservationId')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('예약 상세 정보가 성공적으로 조회되었습니다.')
    @ApiOkResponse({ type: ReservationDetailResponseDto })
    @ApiParam({ name: 'reservationId', type: String, description: 'UUID' })
    async getReservationDetail(
        @CurrentUser() user: RequestUser,
        @Param('reservationId') reservationId: string,
    ): Promise<ReservationDetailResponseDto> {
        return this.detailUseCase.execute(user.id, reservationId);
    }

    @Post('reservations/:reservationId/cancel')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('예약이 성공적으로 취소되었습니다.')
    @ApiOkResponse({ type: CancelReservationResponseDto })
    @ApiParam({ name: 'reservationId', type: String, description: 'UUID' })
    async cancelReservation(
        @CurrentUser() user: RequestUser,
        @Param('reservationId') reservationId: string,
    ): Promise<CancelReservationResponseDto> {
        return this.cancelUseCase.execute(user.id, reservationId);
    }

    @Patch('reservations/:reservationId/delivery')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('배송 정보가 저장되었습니다.')
    @ApiOkResponse({ type: DeliveryEditResponseDto })
    @ApiParam({ name: 'reservationId', type: String, description: 'UUID' })
    async updateDelivery(
        @CurrentUser() user: RequestUser,
        @Param('reservationId') reservationId: string,
        @Body(new BodyZodValidationPipe(deliveryEditRequestSchema)) dto: DeliveryEditRequest,
    ): Promise<DeliveryEditResponseDto> {
        return this.updateDeliveryUseCase.execute(user.id, reservationId, dto);
    }
}
