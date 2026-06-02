'use client';

import type { BusinessDocumentUpdateRequest } from '@todam/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateBusinessDocument } from './api';

// 사업자 정보 수정. 성공 시 공방 상세 캐시 무효화(상태 PENDING 전이 반영).
export function useUpdateBusinessDocument(storeId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: BusinessDocumentUpdateRequest) => updateBusinessDocument(storeId, body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['partner', 'stores', storeId] });
        },
    });
}
