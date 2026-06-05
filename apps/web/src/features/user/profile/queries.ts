'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateMyProfileBody } from '@todam/shared';

import { getMyProfile, updateMyProfile } from './api';

export const MY_PROFILE_QUERY_KEY = ['users', 'me'] as const;

// GET /users/me
export function useMyProfile() {
    return useQuery({
        queryKey: MY_PROFILE_QUERY_KEY,
        queryFn: getMyProfile,
    });
}

// PATCH /users/me — 성공 시 프로필 캐시 invalidate
export function useUpdateMyProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: UpdateMyProfileBody) => updateMyProfile(body),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: MY_PROFILE_QUERY_KEY });
        },
    });
}
