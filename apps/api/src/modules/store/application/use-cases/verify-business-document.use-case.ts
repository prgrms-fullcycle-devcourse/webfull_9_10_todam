import { Injectable } from '@nestjs/common';
import { BusinessState, BusinessDocumentVerifyResult, VerificationStatus } from '@todam/shared';
import { NtsService, NtsApiError } from '../../infrastructure/nts.service';
import type { NtsValidateItem } from '../../infrastructure/nts.service';

/**
 * 국세청 b_stt(납세자 상태 문자열) → BusinessState 매핑 테이블.
 * 실제 국세청 API 응답값 기준. 알 수 없는 값은 ACTIVE로 처리(폐업·휴업이 아닌 한 최대 허용).
 */
const B_STT_MAP: Record<string, BusinessState> = {
    계속사업자: BusinessState.ACTIVE,
    폐업자: BusinessState.CLOSED,
    휴업자: BusinessState.SUSPENDED,
};

/**
 * 국세청 API 응답(validate 혹은 status)에서 b_stt 문자열을 받아
 * BusinessState + message + verificationStatus를 결정하는 순수함수.
 *
 * verify 게이트(VerifyBusinessDocumentUseCase)와
 * 제출 핸들러(PrismaCreateStoreCommand 내 재검증)에서 공유된다.
 */
export function resolveVerification(bStt: string | undefined | null): {
    verificationStatus: VerificationStatus;
    businessState: BusinessState | null;
    message: BusinessDocumentVerifyResult['message'];
} {
    if (!bStt) {
        // b_stt 정보 없음 → VERIFIED (ACTIVE로 간주)
        return {
            verificationStatus: VerificationStatus.VERIFIED,
            businessState: BusinessState.ACTIVE,
            message: 'VERIFIED',
        };
    }

    const state = B_STT_MAP[bStt] ?? BusinessState.ACTIVE;

    // verificationStatus(진위 일치 여부)와 businessState(영업 상태)는 직교한다.
    // 폐업·휴업도 "번호·이름·개업일이 실제 등록정보와 일치"했으므로 진위확인은 VERIFIED.
    // 등록 가능 여부는 별도 파생 판단(VERIFIED && businessState===ACTIVE)이며, 폐업·휴업은 message로 차단한다.
    switch (state) {
        case BusinessState.CLOSED:
            return {
                verificationStatus: VerificationStatus.VERIFIED,
                businessState: BusinessState.CLOSED,
                message: 'BUSINESS_CLOSED',
            };
        case BusinessState.SUSPENDED:
            return {
                verificationStatus: VerificationStatus.VERIFIED,
                businessState: BusinessState.SUSPENDED,
                message: 'BUSINESS_SUSPENDED',
            };
        case BusinessState.ACTIVE:
        default:
            return {
                verificationStatus: VerificationStatus.VERIFIED,
                businessState: BusinessState.ACTIVE,
                message: 'VERIFIED',
            };
    }
}

/**
 * 사업자등록증 진위확인 유스케이스 (stateless — DB 미접근).
 *
 * 처리 흐름:
 * 1. NtsService.validate() 호출
 * 2. valid === '02' → MISMATCH 결과 DTO 반환
 * 3. valid === '01':
 *    - b_stt 포함 → resolveVerification()으로 businessState 결정 (1회 호출 경로)
 *    - b_stt 미포함 → NtsService.getStatus() 추가 호출 (2회 호출 경로)
 * 4. NtsApiError → ERROR 결과 DTO 반환
 */
@Injectable()
export class VerifyBusinessDocumentUseCase {
    constructor(private readonly nts: NtsService) {}

    async execute(
        businessNumber: string,
        ownerName: string,
        startDate: string,
    ): Promise<BusinessDocumentVerifyResult> {
        try {
            const validateRes = await this.nts.validate(businessNumber, ownerName, startDate);
            const item: NtsValidateItem | undefined = validateRes.data[0];

            if (!item || item.valid === '02') {
                return {
                    verificationStatus: VerificationStatus.MISMATCH,
                    businessState: null,
                    message: 'MISMATCH',
                };
            }

            // valid === '01': 진위확인 통과. 이제 납세자 상태를 확인한다.
            let bStt: string | undefined = item.b_stt;

            // b_stt가 응답에 포함되지 않은 경우 상태조회 API 추가 호출 (2회 호출 경로)
            if (!bStt) {
                const statusRes = await this.nts.getStatus(businessNumber);
                bStt = statusRes.data[0]?.b_stt;
            }

            return resolveVerification(bStt);
        } catch (error) {
            if (error instanceof NtsApiError) {
                return {
                    verificationStatus: VerificationStatus.ERROR,
                    businessState: null,
                    message: 'NTS_ERROR',
                };
            }
            throw error;
        }
    }
}
