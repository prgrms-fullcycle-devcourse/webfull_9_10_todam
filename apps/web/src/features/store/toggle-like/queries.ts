'use client';

import { useMutation } from '@tanstack/react-query';

import { toggleLike } from './api';

export function useToggleLike() {
    return useMutation({
        mutationFn: ({ storeId, liked }: { storeId: string; liked: boolean }) =>
            toggleLike(storeId, liked),
    });
}
