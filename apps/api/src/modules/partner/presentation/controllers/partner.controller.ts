import { Controller, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../../common/decorators/response-message.decorator';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { TerminatePartnerUseCase } from '../../application/use-cases/terminate-partner.use-case';
import { TerminatePartnerResponseDto } from '../dto/terminate-partner.dto';

@ApiTags('partners')
@ApiBearerAuth()
@Controller('partners')
export class PartnerController {
    constructor(private readonly terminatePartner: TerminatePartnerUseCase) {}

    @Delete('me')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ResponseMessage('Partner qualification terminated.')
    @ApiOkResponse({
        description: 'Partner qualification terminated.',
        type: TerminatePartnerResponseDto,
    })
    terminate(@CurrentUser() user: RequestUser): Promise<null> {
        return this.terminatePartner.execute(user.id);
    }
}
