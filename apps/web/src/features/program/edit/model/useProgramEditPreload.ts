'use client';

import { usePartnerProgramDetail } from '@/features/program/detail';

// 프로그램 수정 폼 preload.
// storeId 는 진입 시 ?storeId= 쿼리로 운반(detail/list 컨벤션). programId 는 라우트 [id].
export function useProgramEditPreload(storeId: string, programId: string) {
    const { data, isLoading } = usePartnerProgramDetail(storeId, programId);

    return { programId, program: data?.program, isLoading };
}
