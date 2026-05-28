import { HttpStatus } from '@nestjs/common';

// 응답 봉투의 `error` 필드에 들어가는 표준 코드.
// 도메인별 코드(EMAIL_ALREADY_EXISTS 등)는 BusinessException으로 자유롭게 확장한다.
export const ErrorCode = {
    INVALID_REQUEST: 'INVALID_REQUEST',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// HttpException → 기본 에러 코드 매핑 (도메인 코드가 따로 없을 때 사용)
export function defaultErrorCode(status: number): string {
    switch (status) {
        case HttpStatus.BAD_REQUEST:
            return ErrorCode.INVALID_REQUEST;
        case HttpStatus.UNAUTHORIZED:
            return ErrorCode.UNAUTHORIZED;
        case HttpStatus.FORBIDDEN:
            return ErrorCode.FORBIDDEN;
        case HttpStatus.NOT_FOUND:
            return ErrorCode.NOT_FOUND;
        case HttpStatus.CONFLICT:
            return ErrorCode.CONFLICT;
        case HttpStatus.UNPROCESSABLE_ENTITY:
            return ErrorCode.UNPROCESSABLE_ENTITY;
        default:
            return ErrorCode.INTERNAL_SERVER_ERROR;
    }
}
