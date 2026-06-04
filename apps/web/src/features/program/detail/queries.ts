'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { UpdateProgramStatusRequest } from '@todam/shared';

import { getPartnerProgramDetail, updateProgramStatus } from './api';

// 파트너 클래스 쿼리 키. prefix(목록) → 상세까지 포함.
const PROGRAMS_KEY = (storeId: string) => ['partner', 'stores', storeId, 'programs'] as const;
const DETAIL_KEY = (storeId: string, programId: string) =>
    [...PROGRAMS_KEY(storeId), programId] as const;

// 파트너 클래스 상세 조회 훅.
export function usePartnerProgramDetail(storeId: string, programId: string) {
    return useQuery({
        queryKey: DETAIL_KEY(storeId, programId),
        queryFn: () => getPartnerProgramDetail(storeId, programId),
        enabled: !!storeId && !!programId,
        staleTime: 30_000,
    });
}

// 클래스 게시 상태 변경 훅. 성공 시 상세·목록 캐시 무효화.
export function useUpdateProgramStatus(storeId: string, programId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: UpdateProgramStatusRequest) =>
            updateProgramStatus(storeId, programId, body),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: PROGRAMS_KEY(storeId) }),
    });
}
