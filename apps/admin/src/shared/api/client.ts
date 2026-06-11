import { getAuthToken } from './auth-token';
import { parseApiResponse } from './parse';
import { ApiError } from './types';

// admin SPA는 프록시 없이 API를 직접 호출(Bearer 토큰). BE CORS 허용 필요.
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

type ApiErrorHandler = (error: ApiError) => void;
let apiErrorHandler: ApiErrorHandler | null = null;

export function setApiErrorHandler(handler: ApiErrorHandler): void {
    apiErrorHandler = handler;
}

export async function adminApiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, headers, ...rest } = options;
    const token = getAuthToken();
    const requestHeaders = new Headers(headers);

    if (body !== undefined && !requestHeaders.has('Content-Type')) {
        requestHeaders.set('Content-Type', 'application/json');
    }
    if (token && !requestHeaders.has('Authorization')) {
        requestHeaders.set('Authorization', `Bearer ${token}`);
    }

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            ...rest,
            headers: requestHeaders,
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        return await parseApiResponse<T>(res);
    } catch (error) {
        if (error instanceof ApiError) apiErrorHandler?.(error);
        throw error;
    }
}
