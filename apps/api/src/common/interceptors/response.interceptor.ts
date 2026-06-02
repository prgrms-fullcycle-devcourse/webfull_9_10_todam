import { Injectable } from '@nestjs/common';
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';
import type { ApiSuccessResponse } from '../dto/api-response';

const DEFAULT_SUCCESS_MESSAGE = '요청이 성공적으로 처리되었습니다.';

// 컨트롤러가 반환한 값을 apispec 공통 성공 봉투로 감싼다.
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
    constructor(private readonly reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessResponse<T>> {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<Request>();
        const response = httpContext.getResponse<Response>();

        const message =
            this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
                context.getHandler(),
                context.getClass(),
            ]) ?? DEFAULT_SUCCESS_MESSAGE;

        return next.handle().pipe(
            map((data) => ({
                statusCode: response.statusCode,
                timestamp: new Date().toISOString(),
                path: request.url,
                message,
                data: (data ?? null) as T,
                error: null,
            })),
        );
    }
}
