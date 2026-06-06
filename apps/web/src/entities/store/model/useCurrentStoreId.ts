'use client';

import { useCurrentStore } from './currentStore';

export function useCurrentStoreId(): string {
    const { storeId } = useCurrentStore();
    return storeId ?? '';
}
