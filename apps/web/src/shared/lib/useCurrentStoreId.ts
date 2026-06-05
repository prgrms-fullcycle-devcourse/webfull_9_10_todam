'use client';

import { useCurrentStore } from '@/entities/store';

// 현재 공방 ID를 반환하는 훅.
export function useCurrentStoreId(): string {
    const { storeId } = useCurrentStore();
    return storeId ?? '';
}
