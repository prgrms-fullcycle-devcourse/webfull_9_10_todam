import { getAuthToken } from './auth-token';
import { ApiError, type ApiErrorResponse, type ApiSuccessResponse } from './types';

// MSW 가 가로채는 동안에는 상대경로면 충분. 실제 API 연동 시 NEXT_PUBLIC_API_URL 로 교체.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

function resolveUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

// 성공 시 data 만 반환, 실패 시 ApiError throw. 봉투 언래핑 단일 지점.
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, headers, ...rest } = options;
    const token = getAuthToken();

    const res = await fetch(resolveUrl(path), {
        ...rest,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    const json = (await res.json()) as ApiSuccessResponse<T> | ApiErrorResponse;

    if (!res.ok || json.error !== null) {
        throw new ApiError(json as ApiErrorResponse);
    }

    return (json as ApiSuccessResponse<T>).data;
}
