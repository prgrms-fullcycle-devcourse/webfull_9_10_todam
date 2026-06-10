'use client';

import { useCurrentStudio } from './currentStudio';

export function useCurrentStudioId(): string {
    const { storeId } = useCurrentStudio();
    return storeId ?? '';
}
