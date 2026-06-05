import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../../common/decorators/response-message.decorator';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { CreateUserReservationUseCase } from '../../application/use-cases/create-user-reservation.use-case';
import { ListUserReservationsUseCase } from '../../application/use-cases/list-user-reservations.use-case';
import {
    CreateUserReservationDto,
    CreateUserReservationResponseDto,
    GetMyReservationsQueryDto,
    MyReservationsResponseDto,
} from '../dto/user-reservation.dto';

@ApiTags('reservations')
@ApiBearerAuth()
@Controller()
export class UserReservationController {
    constructor(
        private readonly createUseCase: CreateUserReservationUseCase,
        private readonly listUseCase: ListUserReservationsUseCase,
    ) {}

    @Get('reservations/me')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('예약 목록이 성공적으로 조회되었습니다.')
    @ApiOkResponse({ type: MyReservationsResponseDto })
    async listMyReservations(
        @CurrentUser() user: RequestUser,
        @Query() query: GetMyReservationsQueryDto,
    ): Promise<MyReservationsResponseDto> {
        return this.listUseCase.execute(user.id, query);
    }

    @Post('reservations')
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(AuthGuard)
    @ResponseMessage('예약이 성공적으로 접수되었습니다.')
    @ApiCreatedResponse({ type: CreateUserReservationResponseDto })
    async create(
        @CurrentUser() user: RequestUser,
        @Body() dto: CreateUserReservationDto,
    ): Promise<CreateUserReservationResponseDto> {
        return this.createUseCase.execute(user.id, dto);
    }
}
