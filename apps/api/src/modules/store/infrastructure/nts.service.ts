import { Injectable, Logger } from '@nestjs/common';
import { createApiEnv } from '@todam/config';

/**
 * 국세청 진위확인 API 응답 내 사업자 항목.
 * valid: '01' = 일치, '02' = 불일치 (그 외 예상 못한 값은 호출부에서 fail-closed 처리)
 * b_stt: '계속사업자' | '폐업자' | '휴업자' (포함 여부는 실 스펙에 따라 결정)
 */
export interface NtsValidateItem {
    b_no: string;
    // 외부 API 원시값. '01'/'02' 외 값이 올 수 있어 string으로 받고 호출부에서 방어한다.
    valid: string;
    valid_msg?: string;
    request_param?: Record<string, unknown>;
    /** 납세자 상태 — 진위확인 응답에 포함될 경우 상태조회 2차 호출 불필요 */
    b_stt?: string;
    b_stt_cd?: string;
    tax_type?: string;
    tax_type_cd?: string;
    end_dt?: string;
    utcc_yn?: string;
    tax_type_change_dt?: string;
    invoice_apply_dt?: string;
    rbf_tax_type?: string;
    rbf_tax_type_cd?: string;
}

export interface NtsValidateResponse {
    status_code: string;
    data: NtsValidateItem[];
    /** 원본 응답 전체 보관 (ntsRaw.validate 저장용) */
    _raw: unknown;
}

export interface NtsStatusItem {
    b_no: string;
    b_stt: string;
    b_stt_cd: string;
    tax_type?: string;
    tax_type_cd?: string;
    end_dt?: string;
    utcc_yn?: string;
    tax_type_change_dt?: string;
    invoice_apply_dt?: string;
    rbf_tax_type?: string;
    rbf_tax_type_cd?: string;
}

export interface NtsStatusResponse {
    status_code: string;
    data: NtsStatusItem[];
    /** 원본 응답 전체 보관 (ntsRaw.status 저장용) */
    _raw: unknown;
}

/** 국세청 API 호출 실패(타임아웃·네트워크 오류·HTTP 5xx) 시 throw */
export class NtsApiError extends Error {
    constructor(
        message: string,
        public readonly cause?: unknown,
    ) {
        super(message);
        this.name = 'NtsApiError';
    }
}

const NTS_TIMEOUT_MS = 5_000;
const NTS_VALIDATE_URL = 'https://api.odcloud.kr/api/nts-businessman/v1/validate';
const NTS_STATUS_URL = 'https://api.odcloud.kr/api/nts-businessman/v1/status';

@Injectable()
export class NtsService {
    private readonly logger = new Logger(NtsService.name);
    private readonly apiKey: string;

    constructor() {
        const env = createApiEnv();
        // optional로 선언되어 있으므로 런타임에 존재 여부를 검사한다.
        if (!env.NTS_API_KEY) {
            this.logger.warn(
                'NTS_API_KEY가 설정되지 않았습니다. 국세청 진위확인 API 호출이 실패합니다.',
            );
        }
        this.apiKey = env.NTS_API_KEY ?? '';
    }

    /**
     * 국세청 사업자등록정보 진위확인 API 호출.
     * https://api.odcloud.kr/api/nts-businessman/v1/validate
     *
     * @throws NtsApiError — 타임아웃·네트워크 오류·HTTP 4xx/5xx
     */
    async validate(
        businessNumber: string,
        ownerName: string,
        startDate: string,
    ): Promise<NtsValidateResponse> {
        const body = {
            businesses: [
                {
                    b_no: businessNumber,
                    p_nm: ownerName,
                    start_dt: startDate,
                },
            ],
        };

        const raw = await this.callNts(NTS_VALIDATE_URL, body, 'validate');
        const data = raw as {
            status_code?: string;
            data?: NtsValidateItem[];
        };

        return {
            status_code: data.status_code ?? '',
            data: data.data ?? [],
            _raw: raw,
        };
    }

    /**
     * 국세청 사업자 상태조회 API 호출 (b_stt 미포함 시 2회 호출 경로에서만 사용).
     * https://api.odcloud.kr/api/nts-businessman/v1/status
     *
     * @throws NtsApiError — 타임아웃·네트워크 오류·HTTP 4xx/5xx
     */
    async getStatus(businessNumber: string): Promise<NtsStatusResponse> {
        const body = {
            b_no: [businessNumber],
        };

        const raw = await this.callNts(NTS_STATUS_URL, body, 'status');
        const data = raw as {
            status_code?: string;
            data?: NtsStatusItem[];
        };

        return {
            status_code: data.status_code ?? '',
            data: data.data ?? [],
            _raw: raw,
        };
    }

    private async callNts(url: string, body: unknown, label: string): Promise<unknown> {
        if (!this.apiKey) {
            throw new NtsApiError('NTS_API_KEY가 설정되지 않아 국세청 API를 호출할 수 없습니다.');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), NTS_TIMEOUT_MS);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Infuser ${this.apiKey}`,
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            if (!response.ok) {
                const text = await response.text().catch(() => '');
                this.logger.error(
                    `국세청 ${label} API HTTP 오류: status=${response.status} body=${text}`,
                );
                throw new NtsApiError(`국세청 API 오류 (${label}): HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            if (error instanceof NtsApiError) throw error;

            const isAbort = error instanceof Error && error.name === 'AbortError';
            const message = isAbort
                ? `국세청 ${label} API 타임아웃 (${NTS_TIMEOUT_MS}ms)`
                : `국세청 ${label} API 네트워크 오류: ${error instanceof Error ? error.message : String(error)}`;

            this.logger.error(message);
            throw new NtsApiError(message, error);
        } finally {
            clearTimeout(timeoutId);
        }
    }
}
