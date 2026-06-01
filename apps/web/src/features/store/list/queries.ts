'use client';

import { useQuery } from '@tanstack/react-query';

import { getPartnerStores } from './api';

const KEY = ['partner', 'stores'] as const;

// 내 공방 목록 조회
export function usePartnerStores() {
    return useQuery({
        queryKey: KEY,
        queryFn: getPartnerStores,
    });
}
