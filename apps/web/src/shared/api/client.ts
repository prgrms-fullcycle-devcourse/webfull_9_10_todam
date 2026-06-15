import { getAuthToken } from './auth-token';
import { parseApiResponse } from './parse';
import { ApiError } from './types';

// 항상 Next API 프록시 경유(쿠키 전달·CORS 회피). 프록시가 서버사이드에서 API_URL 로 전달.
function resolveUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `/api/proxy${path}`;
}

export type RequestOptions = Omit<RequestInit, 'body'> & {
    body?: unknown;
    // true 면 전역 인증 에러 핸들러(로그인 모달/리다이렉트)를 건너뛴다.
    // 부팅 세션 복원(/auth/refresh)처럼 401 이 정상 흐름인 호출에서 사용.
    skipErrorHandler?: boolean;
};
type ApiErrorHandler = (error: ApiError) => void;

let apiErrorHandler: ApiErrorHandler | null = null;

export function setApiErrorHandler(handler: ApiErrorHandler): void {
    apiErrorHandler = handler;
}

export async function clientApiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, headers, skipErrorHandler, ...rest } = options;
    const token = getAuthToken();
    const requestHeaders = new Headers(headers);
    const url = resolveUrl(path);

    if (body !== undefined && !requestHeaders.has('Content-Type')) {
        requestHeaders.set('Content-Type', 'application/json');
    }
    if (token) {
        if (url.startsWith('/api/proxy')) {
            requestHeaders.set('X-Todam-Access-Token', token);
        } else if (!requestHeaders.has('Authorization')) {
            requestHeaders.set('Authorization', `Bearer ${token}`);
        }
    }

    try {
        const res = await fetch(url, {
            ...rest,
            headers: requestHeaders,
            body: body === undefined ? undefined : JSON.stringify(body),
        });

        return await parseApiResponse<T>(res);
    } catch (error) {
        if (error instanceof ApiError && !skipErrorHandler) apiErrorHandler?.(error);
        throw error;
    }
}
