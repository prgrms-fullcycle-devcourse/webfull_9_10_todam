'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import { checkSlug, geocode, getStoreRegistrationStatus, submitStoreRegistration } from './api';
import type { StoreRegistrationForm } from './model/types';

const KEY = ['partner', 'onboarding'] as const;

// 공방 URL 중복확인 (debounced slug 를 enabled 로 제어)
export function useSlugAvailability(slug: string, enabled: boolean) {
    return useQuery({
        queryKey: [...KEY, 'slug', slug],
        queryFn: () => checkSlug(slug),
        enabled,
        staleTime: 0,
    });
}

// 주소 → 좌표
export function useGeocode() {
    return useMutation({ mutationFn: (query: string) => geocode(query) });
}

// 공방 등록 제출
export function useSubmitStoreRegistration() {
    return useMutation({
        mutationFn: (form: StoreRegistrationForm) => submitStoreRegistration(form),
    });
}

// 검수 상태 조회
export function useStoreRegistrationStatus(preview?: 'rejected') {
    return useQuery({
        queryKey: [...KEY, 'status', preview ?? 'default'],
        queryFn: () => getStoreRegistrationStatus(preview),
    });
}
