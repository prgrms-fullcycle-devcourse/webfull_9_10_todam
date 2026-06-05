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
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PartnerGuard } from '../../../../common/guards/partner.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../../common/decorators/response-message.decorator';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { GenerateTimeSlotsUseCase } from '../../application/use-cases/generate-time-slots.use-case';
import { ListTimeSlotsUseCase } from '../../application/use-cases/list-time-slots.use-case';
import { UpdateTimeSlotStatusUseCase } from '../../application/use-cases/update-time-slot-status.use-case';
import { CreateReservationRestrictionsUseCase } from '../../application/use-cases/create-reservation-restrictions.use-case';
import { DeleteReservationRestrictionsUseCase } from '../../application/use-cases/delete-reservation-restrictions.use-case';
import { GetProgramReservationCountsUseCase } from '../../application/use-cases/get-program-reservation-counts.use-case';
import { GetProgramAvailableSlotsUseCase } from '../../application/use-cases/get-program-available-slots.use-case';
import { GenerateTimeSlotsDto, GenerateTimeSlotsResponseDto } from '../dto/generate-time-slots.dto';
import { AvailableSlotsQueryDto, AvailableSlotsResponseDto } from '../dto/available-slots.dto';
import { ListTimeSlotsQueryDto, ListTimeSlotsResponseDto } from '../dto/list-time-slots.dto';
import {
    UpdateTimeSlotStatusDto,
    UpdateTimeSlotStatusResponseDto,
} from '../dto/update-time-slot-status.dto';
import {
    CreateReservationRestrictionsDto,
    CreateReservationRestrictionsResponseDto,
} from '../dto/create-reservation-restrictions.dto';
import {
    DeleteReservationRestrictionsDto,
    DeleteReservationRestrictionsResponseDto,
} from '../dto/delete-reservation-restrictions.dto';
import {
    ProgramReservationCountsQueryDto,
    ProgramReservationCountsResponseDto,
} from '../dto/program-reservation-counts.dto';

@ApiTags('partner-time-slots')
@ApiBearerAuth()
@Controller()
export class TimeslotController {
    constructor(
        private readonly generateTimeSlotsUseCase: GenerateTimeSlotsUseCase,
        private readonly listTimeSlotsUseCase: ListTimeSlotsUseCase,
        private readonly updateTimeSlotStatusUseCase: UpdateTimeSlotStatusUseCase,
        private readonly createReservationRestrictionsUseCase: CreateReservationRestrictionsUseCase,
        private readonly deleteReservationRestrictionsUseCase: DeleteReservationRestrictionsUseCase,
        private readonly getProgramReservationCountsUseCase: GetProgramReservationCountsUseCase,
        private readonly getProgramAvailableSlotsUseCase: GetProgramAvailableSlotsUseCase,
    ) {}

    @Post('partner/stores/:storeId/time-slots/generate')
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('타임슬롯이 성공적으로 생성되었습니다.')
    @ApiCreatedResponse({
        description: '타임슬롯 자동 생성 성공',
        type: GenerateTimeSlotsResponseDto,
    })
    async generateTimeSlots(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Body() dto: GenerateTimeSlotsDto,
    ): Promise<GenerateTimeSlotsResponseDto> {
        return this.generateTimeSlotsUseCase.execute(user.id, storeId, dto);
    }

    @Get('partner/stores/:storeId/time-slots')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('타임슬롯 목록이 성공적으로 조회되었습니다.')
    @ApiOkResponse({ description: '타임슬롯 목록 조회 성공', type: ListTimeSlotsResponseDto })
    async listTimeSlots(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Query() query: ListTimeSlotsQueryDto,
    ): Promise<ListTimeSlotsResponseDto> {
        return this.listTimeSlotsUseCase.execute(user.id, storeId, query);
    }

    @Patch('partner/stores/:storeId/time-slots/:timeSlotId/status')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('타임슬롯 상태가 성공적으로 변경되었습니다.')
    @ApiOkResponse({
        description: '타임슬롯 상태 변경 성공',
        type: UpdateTimeSlotStatusResponseDto,
    })
    async updateTimeSlotStatus(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Param('timeSlotId') timeSlotId: string,
        @Body() dto: UpdateTimeSlotStatusDto,
    ): Promise<UpdateTimeSlotStatusResponseDto> {
        return this.updateTimeSlotStatusUseCase.execute(user.id, storeId, timeSlotId, dto);
    }

    @Post('partner/stores/:storeId/reservation-restrictions')
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('클래스별 예약 막기가 적용되었습니다.')
    @ApiCreatedResponse({
        description: '클래스별 예약 막기 적용 성공',
        type: CreateReservationRestrictionsResponseDto,
    })
    async createReservationRestrictions(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Body() dto: CreateReservationRestrictionsDto,
    ): Promise<CreateReservationRestrictionsResponseDto> {
        return this.createReservationRestrictionsUseCase.execute(user.id, storeId, dto);
    }

    @Delete('partner/stores/:storeId/reservation-restrictions')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('클래스별 예약 막기가 해제되었습니다.')
    @ApiOkResponse({
        description: '클래스별 예약 막기 해제 성공',
        type: DeleteReservationRestrictionsResponseDto,
    })
    async deleteReservationRestrictions(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Body() dto: DeleteReservationRestrictionsDto,
    ): Promise<DeleteReservationRestrictionsResponseDto> {
        return this.deleteReservationRestrictionsUseCase.execute(user.id, storeId, dto);
    }

    @Get('partner/stores/:storeId/programs/reservation-counts')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard, PartnerGuard)
    @ResponseMessage('프로그램별 확정 예약 건수가 조회되었습니다.')
    @ApiOkResponse({
        description: '프로그램별 확정 예약 건수 조회 성공',
        type: ProgramReservationCountsResponseDto,
    })
    async getProgramReservationCounts(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Query() query: ProgramReservationCountsQueryDto,
    ): Promise<ProgramReservationCountsResponseDto> {
        return this.getProgramReservationCountsUseCase.execute(user.id, storeId, query);
    }

    @Get('programs/:programId/available-slots')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('예약 가능 시간 목록이 성공적으로 조회되었습니다.')
    @ApiOkResponse({ description: '예약 가능 시간 조회 성공', type: AvailableSlotsResponseDto })
    async getProgramAvailableSlots(
        @Param('programId') programId: string,
        @Query() query: AvailableSlotsQueryDto,
    ): Promise<AvailableSlotsResponseDto> {
        return this.getProgramAvailableSlotsUseCase.execute(programId, query);
    }
}
