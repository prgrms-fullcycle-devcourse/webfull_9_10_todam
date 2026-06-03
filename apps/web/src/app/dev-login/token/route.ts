import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { NextResponse } from 'next/server';

/**
 * dev 전용 토큰 조회 (폰 실기 테스트).
 * scripts/mobile-dev.mjs 가 기록한 .dev-login.json 을 nonce 일치 시 반환한다.
 * - production 빌드에서는 404.
 * - nonce 불일치/파일 없음은 노출 최소화를 위해 404.
 */
export async function GET(request: Request): Promise<NextResponse> {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    const nonce = new URL(request.url).searchParams.get('n');
    if (!nonce) return NextResponse.json({ error: 'missing nonce' }, { status: 400 });

    try {
        // next dev cwd = apps/web → 루트의 .dev-login.json.
        const file = join(process.cwd(), '.dev-login.json');
        const data = JSON.parse(readFileSync(file, 'utf8')) as {
            nonce: string;
            token: string;
            api?: string;
            next?: string;
        };
        if (nonce !== data.nonce) {
            return NextResponse.json({ error: 'not found' }, { status: 404 });
        }
        return NextResponse.json({ token: data.token, api: data.api, next: data.next });
    } catch {
        return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
}
