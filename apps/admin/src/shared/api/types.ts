// API 공통 응답 봉투. apps/api 의 common/dto/api-response.ts 와 형태 일치.
export interface ApiSuccessResponse<T> {
    statusCode: number;
    timestamp: string;
    path: string;
    message: string;
    data: T;
    error: null;
}

export interface ApiErrorResponse {
    statusCode: number;
    timestamp: string;
    path: string;
    message: string;
    data: null;
    error: string; // ErrorCode 문자열
}

// 클라이언트에서 throw 되는 에러. error 코드로 화면 분기.
export class ApiError extends Error {
    readonly statusCode: number;
    readonly code: string;

    constructor(response: ApiErrorResponse) {
        super(response.message);
        this.name = 'ApiError';
        this.statusCode = response.statusCode;
        this.code = response.error;
    }
}
