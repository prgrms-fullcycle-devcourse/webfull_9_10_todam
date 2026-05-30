'use client';

import { useEffect, useState, type ReactNode } from 'react';

// MSW 활성화 여부. 'disabled' 명시 시에만 끈다(기본 on).
const MOCKING_ENABLED = process.env.NEXT_PUBLIC_API_MOCKING !== 'disabled';

export function MswProvider({ children }: { children: ReactNode }) {
    // mock 비활성 시 즉시 통과.
    const [ready, setReady] = useState(!MOCKING_ENABLED);

    useEffect(() => {
        if (!MOCKING_ENABLED) return;
        let active = true;
        void (async () => {
            const { worker } = await import('./browser');
            await worker.start({ onUnhandledRequest: 'bypass' });
            if (active) setReady(true);
        })();
        return () => {
            active = false;
        };
    }, []);

    if (!ready) return null;
    return <>{children}</>;
}
