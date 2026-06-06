import { ApiError, type ApiErrorResponse, type ApiSuccessResponse } from './types';

function fallbackError(statusCode: number, path: string, message: string): ApiErrorResponse {
    return {
        statusCode,
        timestamp: new Date().toISOString(),
        path,
        message,
        data: null,
        error: statusCode === 401 ? 'UNAUTHORIZED' : 'API_ERROR',
    };
}

async function readJson(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
    if (typeof value !== 'object' || value === null) return false;
    const candidate = value as Partial<ApiErrorResponse>;
    return (
        typeof candidate.statusCode === 'number' &&
        typeof candidate.message === 'string' &&
        candidate.data === null &&
        typeof candidate.error === 'string'
    );
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
    if (typeof value !== 'object' || value === null) return false;
    const candidate = value as Partial<ApiSuccessResponse<T>>;
    return (
        typeof candidate.statusCode === 'number' && candidate.error === null && 'data' in candidate
    );
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
    const json = await readJson(response);

    if (!response.ok) {
        throw new ApiError(
            isApiErrorResponse(json)
                ? json
                : fallbackError(
                      response.status,
                      new URL(response.url).pathname,
                      response.statusText,
                  ),
        );
    }

    if (isApiErrorResponse(json)) {
        throw new ApiError(json);
    }

    if (!isApiSuccessResponse<T>(json)) {
        throw new ApiError(
            fallbackError(
                response.status,
                new URL(response.url).pathname,
                'API 응답 형식이 올바르지 않습니다.',
            ),
        );
    }

    return json.data;
}
