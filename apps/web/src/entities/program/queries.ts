'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { UpdateProgramStatusRequest } from '@todam/shared';

import { getPartnerProgramDetail, updateProgramStatus } from './api';

const PROGRAMS_KEY = (storeId: string) => ['partner', 'stores', storeId, 'programs'] as const;
const DETAIL_KEY = (storeId: string, programId: string) =>
    [...PROGRAMS_KEY(storeId), programId] as const;

export function usePartnerProgramDetail(storeId: string, programId: string) {
    return useQuery({
        queryKey: DETAIL_KEY(storeId, programId),
        queryFn: () => getPartnerProgramDetail(storeId, programId),
        enabled: !!storeId && !!programId,
        staleTime: 30_000,
    });
}

export function useUpdateProgramStatus(storeId: string, programId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: UpdateProgramStatusRequest) =>
            updateProgramStatus(storeId, programId, body),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: PROGRAMS_KEY(storeId) }),
    });
}
