'use client';

import { useEffect, useState } from 'react';

/**
 * dev 전용 토큰 주입 라우트 (폰 실기 테스트용).
 * QR(?n=<nonce>) 로 진입 → /dev-login/token 에서 토큰 조회 →
 * accessToken + 런타임 API base 를 localStorage 에 저장 후 목적지로 이동.
 * - 토큰은 URL/QR 에 없고 nonce 로만 서버에서 받아옴(노출 최소화).
 * - production 빌드에서는 비활성(no-op).
 */
export default function DevLoginPage() {
    const [message, setMessage] = useState('토큰 적용 중…');

    useEffect(() => {
        let cancelled = false;
        // async IIFE: setMessage 가 effect 동기 실행 중이 아니라 microtask 에서 일어나게 함.
        void (async () => {
            if (process.env.NODE_ENV === 'production') {
                if (!cancelled) setMessage('이 페이지는 개발 환경에서만 동작합니다.');
                return;
            }
            const nonce = new URLSearchParams(window.location.search).get('n');
            if (!nonce) {
                if (!cancelled) setMessage('n(nonce) 파라미터가 없습니다.');
                return;
            }
            let data;
            try {
                const res = await fetch(`/dev-login/token?n=${encodeURIComponent(nonce)}`);
                if (!res.ok) {
                    if (!cancelled) setMessage('토큰 조회 실패(만료되었거나 실행 중이 아님).');
                    return;
                }
                data = (await res.json()) as { token: string; api?: string; next?: string };
            } catch {
                if (!cancelled) setMessage('토큰 조회 중 오류.');
                return;
            }
            window.localStorage.setItem('accessToken', data.token);
            if (data.api) window.localStorage.setItem('todam_dev_api_base', data.api);
            // next 미지정/빈값 → 루트로.
            window.location.replace(data.next && data.next.length > 0 ? data.next : '/');
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return <div style={{ padding: 24, fontFamily: 'sans-serif', fontSize: 14 }}>{message}</div>;
}
