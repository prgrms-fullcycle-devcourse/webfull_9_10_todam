'use client';

import { usePartnerProgramDetail } from '@/features/program/detail';

// 프로그램 수정 폼 preload.
export function useProgramEditPreload(storeId: string, programId: string) {
    const { data, isLoading } = usePartnerProgramDetail(storeId, programId);

    return { programId, program: data?.program, isLoading };
}
