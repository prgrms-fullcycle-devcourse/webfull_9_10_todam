'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import type { CreateUserReservationRequest } from '@todam/shared';

import { ApiError } from '@/shared/api';

import { createUserReservation, getAvailableSlots } from './api';

const SLOTS_KEY = ['reservations', 'available-slots'] as const;

// 예약 가능 슬롯 조회 훅.
// year/month 변경 시 자동 재조회 (queryKey에 포함).
export function useAvailableSlots(programId: string, year: number, month: number) {
    return useQuery({
        queryKey: [...SLOTS_KEY, programId, year, month] as const,
        queryFn: () => getAvailableSlots(programId, year, month),
        // 401/403/404 는 사용자 시점에 변하지 않으므로 retry 비활성.
        retry: (failureCount, error) => {
            if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) {
                return false;
            }
            return failureCount < 2;
        },
        enabled: Boolean(programId),
        // 슬롯은 동일 월 내 새로고침 시 stale 취급(30초 유효).
        staleTime: 30_000,
    });
}

// 예약 생성 뮤테이션 훅.
export function useCreateUserReservation() {
    return useMutation({
        mutationFn: (body: CreateUserReservationRequest) => createUserReservation(body),
    });
}
