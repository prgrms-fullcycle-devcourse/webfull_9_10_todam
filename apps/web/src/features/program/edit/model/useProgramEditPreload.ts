'use client';

import { useEffect, useState } from 'react';

import { useProgramDetail } from '../queries';

// preload용 mock slug. 실 연동 시 세션 또는 URL 파라미터로 교체.
const MOCK_SLUG = 'todam-pottery';

// async params(Next.js 15+) 언랩 + 프로그램 상세 preload.
// 두 수정 화면(기본/운영 정보) 공통 진입 로직.
export function useProgramEditPreload(params: Promise<{ id: string }>) {
    const [programId, setProgramId] = useState<string>('');
    useEffect(() => {
        params.then((p) => setProgramId(p.id));
    }, [params]);

    const { data, isLoading } = useProgramDetail(MOCK_SLUG, programId);

    return { programId, program: data?.program, isLoading };
}
