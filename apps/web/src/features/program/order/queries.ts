'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { PartnerProgramReorderRequest } from '@todam/shared';

import { reorderPrograms } from './api';

// list 쿼리 키와 동일(features/program/list/queries.ts) 순서 변경 성공 시 무효화
const LIST_KEY = (storeId: string) => ['partner', 'studios', storeId, 'programs'] as const;

// 파트너 클래스 순서 변경 mutation
export function useReorderPrograms(storeId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: PartnerProgramReorderRequest) => reorderPrograms(storeId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: LIST_KEY(storeId) });
        },
    });
}
