import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../../../../common/decorators/response-message.decorator';
import { GetLatestPoliciesUseCase } from '../../application/use-cases/get-latest-policies.use-case';
import { LatestPoliciesResponseDto } from '../dto/policy.dto';

@ApiTags('policies')
@Controller('policies')
export class PolicyController {
    constructor(private readonly getLatestPolicies: GetLatestPoliciesUseCase) {}

    /**
     * GET /policies/latest
     * 인증 불필요(PUBLIC) — 가입 화면 진입 시(인증 전) 호출됨.
     * isLatest=true 인 PolicyVersion row를 전부 반환한다.
     * 시드 없으면 { policies: [] } 200 반환 (404 아님).
     */
    @Get('latest')
    @HttpCode(HttpStatus.OK)
    @ResponseMessage('최신 약관 목록을 성공적으로 조회했습니다.')
    @ApiOkResponse({ description: '최신 약관 목록 조회 성공', type: LatestPoliciesResponseDto })
    async getLatestPoliciesHandler(): Promise<LatestPoliciesResponseDto> {
        const rows = await this.getLatestPolicies.execute();
        return {
            policies: rows.map((r) => ({
                policyType: r.policyType as
                    | 'PRIVACY_POLICY'
                    | 'TERMS_OF_SERVICE'
                    | 'MARKETING'
                    | 'LOCATION_BASED_SERVICE',
                version: r.version,
                url: r.url,
                effectiveAt: r.effectiveAt.toISOString(),
            })),
        };
    }
}
