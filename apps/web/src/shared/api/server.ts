import 'server-only';

import { headers } from 'next/headers';

import { parseApiResponse } from './parse';

const API_BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';

export interface ServerApiFetchOptions extends Omit<RequestInit, 'body' | 'headers'> {
    body?: unknown;
    headers?: HeadersInit;
    next?: NextFetchRequestConfig;
}

function resolveServerUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
}

export async function serverApiFetch<T>(
    path: string,
    options: ServerApiFetchOptions = {},
): Promise<T> {
    const { body, headers: initHeaders, ...rest } = options;
    const requestHeaders = new Headers(initHeaders);
    const incomingHeaders = await headers();
    const accessToken = incomingHeaders.get('x-todam-access-token');

    if (body !== undefined && !requestHeaders.has('Content-Type')) {
        requestHeaders.set('Content-Type', 'application/json');
    }
    if (accessToken && !requestHeaders.has('Authorization')) {
        requestHeaders.set('Authorization', `Bearer ${accessToken}`);
    }

    const response = await fetch(resolveServerUrl(path), {
        ...rest,
        headers: requestHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    return parseApiResponse<T>(response);
}
