import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCode, defaultErrorCode } from '../constants/error-code';
import type { ApiErrorResponse } from '../dto/api-response';

// 모든 예외를 apispec 공통 실패 봉투로 변환한다.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const httpContext = host.switchToHttp();
        const request = httpContext.getRequest<Request>();
        const response = httpContext.getResponse<Response>();

        let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = '서버 오류가 발생했습니다.';
        let error: string = ErrorCode.INTERNAL_SERVER_ERROR;

        if (exception instanceof BusinessException) {
            // 도메인 예외: errorCode를 그대로 사용
            status = exception.getStatus();
            message = exception.message;
            error = exception.errorCode;
        } else if (exception instanceof HttpException) {
            // 일반 HttpException(검증 실패 포함): status 기반 코드 매핑
            status = exception.getStatus();
            error = defaultErrorCode(status);
            const responseBody = exception.getResponse();
            if (typeof responseBody === 'string') {
                message = responseBody;
            } else if (typeof responseBody === 'object' && responseBody !== null) {
                const raw = (responseBody as { message?: string | string[] }).message;
                message = (Array.isArray(raw) ? raw[0] : raw) ?? exception.message;
            }
        } else {
            // 알 수 없는 예외: 500 처리 + 스택 로깅
            this.logger.error(
                exception instanceof Error
                    ? (exception.stack ?? exception.message)
                    : String(exception),
            );
        }

        const body: ApiErrorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
            data: null,
            error,
        };

        response.status(status).json(body);
    }
}
