'use client';

import { useEffect, useState } from 'react';

/**
 * dev 전용 토큰 주입 라우트 (폰 실기 테스트용).
 * scripts/mobile-dev.mjs 가 발급한 URL hash(#token=...&api=...&next=...)를 받아
 * accessToken + 런타임 API base 를 localStorage 에 저장 후 목적지로 이동한다.
 * - 토큰은 query 가 아닌 hash 로 전달(서버 로그·전송 방지). 적용 후 hash 제거.
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
            const params = new URLSearchParams(window.location.hash.slice(1));
            const token = params.get('token');
            const apiBase = params.get('api');
            const next = params.get('next') || '/partner/stores';

            if (!token) {
                if (!cancelled) setMessage('token 파라미터가 없습니다.');
                return;
            }
            window.localStorage.setItem('accessToken', token);
            if (apiBase) window.localStorage.setItem('todam_dev_api_base', apiBase);
            // hash(토큰) 를 히스토리에서 지우며 목적지로 이동.
            window.location.replace(next);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return <div style={{ padding: 24, fontFamily: 'sans-serif', fontSize: 14 }}>{message}</div>;
}
