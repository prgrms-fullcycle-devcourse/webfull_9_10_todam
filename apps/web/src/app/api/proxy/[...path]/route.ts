import { NextResponse, type NextRequest } from 'next/server';

const API_BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';
const ALLOWED_PREFIXES = [
    '/api/v1/',
    '/auth/',
    '/partner/',
    '/stores', // 컬렉션(`/stores`, `/stores?...`) + 하위(`/stores/search/...`, `/stores/:slug`) 모두 허용
    '/programs', // 퍼블릭 클래스 상세(`/programs/:id`)·리뷰(`/programs/:id/reviews`)·슬롯(`/programs/:id/available-slots`)
    '/users/',
    '/reservations', // 컬렉션(`POST /reservations`) + 하위(`/reservations/:id`) 모두 허용
    '/reviews/',
    '/review/',
    '/artworks/',
];
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

interface RouteContext {
    params: Promise<{ path: string[] }>;
}

function buildBackendPath(parts: string[], search: string): string {
    return `/${parts.map(encodeURIComponent).join('/')}${search}`;
}

function isAllowedPath(path: string): boolean {
    return ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

async function proxy(request: NextRequest, context: RouteContext): Promise<Response> {
    const { path: parts } = await context.params;
    const backendPath = buildBackendPath(parts, request.nextUrl.search);

    if (!API_BASE_URL) {
        return NextResponse.json({ error: 'API_URL is not configured' }, { status: 500 });
    }
    if (!isAllowedPath(backendPath)) {
        return NextResponse.json({ error: 'API path is not allowed' }, { status: 403 });
    }

    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('cookie');
    headers.delete('content-length');
    headers.delete('x-todam-access-token');

    const accessToken = request.headers.get('x-todam-access-token');
    if (accessToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const response = await fetch(`${API_BASE_URL}${backendPath}`, {
        method: request.method,
        headers,
        body: BODY_METHODS.has(request.method) ? await request.arrayBuffer() : undefined,
        cache: 'no-store',
    });

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
