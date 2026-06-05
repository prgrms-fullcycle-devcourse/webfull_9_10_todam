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
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { ReservationStatus } from '@prisma/client';
import {
    cancelPartnerReservationRequestSchema,
    createPartnerReservationRequestSchema,
    listPartnerReservationsQuerySchema,
    partnerReservationCalendarQuerySchema,
    rejectPartnerReservationRequestSchema,
} from '@todam/shared';
import type {
    CancelPartnerReservationRequest,
    CreatePartnerReservationRequest,
    ListPartnerReservationsQuery,
    PartnerReservationCalendarQuery,
    RejectPartnerReservationRequest,
} from '@todam/shared';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PartnerGuard } from '../../../../common/guards/partner.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../../common/decorators/response-message.decorator';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { CancelPartnerReservationUseCase } from '../../application/use-cases/cancel-partner-reservation.use-case';
import { CompletePartnerReservationUseCase } from '../../application/use-cases/complete-partner-reservation.use-case';
import { ConfirmPartnerReservationUseCase } from '../../application/use-cases/confirm-partner-reservation.use-case';
import { CreatePartnerReservationUseCase } from '../../application/use-cases/create-partner-reservation.use-case';
import { GetPartnerReservationCalendarUseCase } from '../../application/use-cases/get-partner-reservation-calendar.use-case';
import { GetPartnerReservationDetailUseCase } from '../../application/use-cases/get-partner-reservation-detail.use-case';
import { ListPartnerReservationsUseCase } from '../../application/use-cases/list-partner-reservations.use-case';
import { RejectPartnerReservationUseCase } from '../../application/use-cases/reject-partner-reservation.use-case';
import {
    CancelPartnerReservationDto,
    CreatePartnerReservationDto,
    CreatePartnerReservationResponseDto,
    GetPartnerReservationDetailResponseDto,
    ListPartnerReservationsResponseDto,
    PartnerReservationCalendarResponseDto,
    PartnerReservationStatusResponseDto,
    RejectPartnerReservationDto,
} from '../dto/partner-reservation.dto';

@ApiTags('partner-reservations')
@ApiBearerAuth()
@Controller()
export class PartnerReservationController {
    constructor(
        private readonly getCalendarUseCase: GetPartnerReservationCalendarUseCase,
        private readonly listUseCase: ListPartnerReservationsUseCase,
        private readonly createUseCase: CreatePartnerReservationUseCase,
        private readonly getDetailUseCase: GetPartnerReservationDetailUseCase,
        private readonly confirmUseCase: ConfirmPartnerReservationUseCase,
        private readonly rejectUseCase: RejectPartnerReservationUseCase,
        private readonly cancelUseCase: CancelPartnerReservationUseCase,
        private readonly completeUseCase: CompletePartnerReservationUseCase,
    ) {}

    @Get('partner/stores/:storeId/reservations/calendar')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('Partner reservation calendar loaded.')
    @ApiOkResponse({ type: PartnerReservationCalendarResponseDto })
    @ApiQuery({ name: 'year', type: Number, example: 2026 })
    @ApiQuery({ name: 'month', type: Number, example: 6 })
    async calendar(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Query(new ZodValidationPipe(partnerReservationCalendarQuerySchema))
        query: PartnerReservationCalendarQuery,
    ): Promise<PartnerReservationCalendarResponseDto> {
        return this.getCalendarUseCase.execute(user.id, storeId, query);
    }

    @Get('partner/stores/:storeId/reservations')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('Partner reservations loaded.')
    @ApiOkResponse({ type: ListPartnerReservationsResponseDto })
    @ApiQuery({ name: 'date', type: String, example: '2026-06-01' })
    @ApiQuery({ name: 'status', enum: ReservationStatus, required: false })
    @ApiQuery({ name: 'programId', type: String, required: false })
    @ApiQuery({ name: 'cursor', type: String, required: false })
    @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
    async list(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Query(new ZodValidationPipe(listPartnerReservationsQuerySchema))
        query: ListPartnerReservationsQuery,
    ): Promise<ListPartnerReservationsResponseDto> {
        return this.listUseCase.execute(user.id, storeId, query);
    }

    @Post('partner/stores/:storeId/reservations')
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('Partner reservation created.')
    @ApiCreatedResponse({ type: CreatePartnerReservationResponseDto })
    @ApiBody({ type: CreatePartnerReservationDto })
    async createManual(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Body(new ZodValidationPipe(createPartnerReservationRequestSchema))
        dto: CreatePartnerReservationRequest,
    ): Promise<CreatePartnerReservationResponseDto> {
        return this.createUseCase.execute(user.id, storeId, dto);
    }

    @Get('partner/reservations/:reservationId')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('Partner reservation detail loaded.')
    @ApiOkResponse({ type: GetPartnerReservationDetailResponseDto })
    async detail(
        @CurrentUser() user: RequestUser,
        @Param('reservationId') reservationId: string,
    ): Promise<GetPartnerReservationDetailResponseDto> {
        return this.getDetailUseCase.execute(user.id, reservationId);
    }

    @Patch('partner/reservations/:reservationId/confirm')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('Reservation confirmed.')
    @ApiOkResponse({ type: PartnerReservationStatusResponseDto })
    async confirm(
        @CurrentUser() user: RequestUser,
        @Param('reservationId') reservationId: string,
    ): Promise<PartnerReservationStatusResponseDto> {
        return this.confirmUseCase.execute(user.id, reservationId);
    }

    @Patch('partner/reservations/:reservationId/reject')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('Reservation rejected.')
    @ApiOkResponse({ type: PartnerReservationStatusResponseDto })
    @ApiBody({ type: RejectPartnerReservationDto })
    async reject(
        @CurrentUser() user: RequestUser,
        @Param('reservationId') reservationId: string,
        @Body(new ZodValidationPipe(rejectPartnerReservationRequestSchema))
        dto: RejectPartnerReservationRequest,
    ): Promise<PartnerReservationStatusResponseDto> {
        return this.rejectUseCase.execute(user.id, reservationId, dto);
    }

    @Patch('partner/reservations/:reservationId/cancel')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('Reservation canceled.')
    @ApiOkResponse({ type: PartnerReservationStatusResponseDto })
    @ApiBody({ type: CancelPartnerReservationDto })
    async cancel(
        @CurrentUser() user: RequestUser,
        @Param('reservationId') reservationId: string,
        @Body(new ZodValidationPipe(cancelPartnerReservationRequestSchema))
        dto: CancelPartnerReservationRequest,
    ): Promise<PartnerReservationStatusResponseDto> {
        return this.cancelUseCase.execute(user.id, reservationId, dto);
    }

    @Patch('partner/reservations/:reservationId/complete')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('Reservation completed.')
    @ApiOkResponse({ type: PartnerReservationStatusResponseDto })
    async complete(
        @CurrentUser() user: RequestUser,
        @Param('reservationId') reservationId: string,
    ): Promise<PartnerReservationStatusResponseDto> {
        return this.completeUseCase.execute(user.id, reservationId);
    }
}
