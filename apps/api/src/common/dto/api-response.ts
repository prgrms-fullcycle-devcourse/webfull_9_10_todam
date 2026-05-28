// apispec 공통 응답 봉투 타입.
// 모든 성공/실패 응답은 이 형태로 감싸서 반환한다.

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
    error: string; // 에러 코드 문자열 (ErrorCode)
}
