'use client';

import { useMutation } from '@tanstack/react-query';

import { toggleFavorite } from './api';

export function useToggleFavorite() {
    return useMutation({
        mutationFn: ({ storeId }: { storeId: string }) => toggleFavorite(storeId),
    });
}
