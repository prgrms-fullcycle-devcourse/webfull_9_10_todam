'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
    CancelPartnerReservationRequest,
    CreatePartnerReservationRequest,
    RejectPartnerReservationRequest,
} from '@todam/shared';

import { ApiError } from '@/shared/api';

import {
    cancelPartnerReservation,
    completePartnerReservation,
    confirmPartnerReservation,
    createPartnerReservation,
    getPartnerProgramReservationCounts,
    getPartnerReservationCalendar,
    getPartnerReservationDetail,
    getPartnerReservationsByDate,
    getPartnerTimeSlotsByDate,
    getReservationDetail,
    getReservationReview,
    rejectPartnerReservation,
} from './api';

const KEY = ['reservations', 'detail'] as const;
const REVIEW_KEY = ['reservations', 'review'] as const;
const PARTNER_CALENDAR_KEY = ['partner', 'reservations', 'calendar'] as const;
const PARTNER_LIST_KEY = ['partner', 'reservations', 'list'] as const;
const PARTNER_DETAIL_KEY = ['partner', 'reservations', 'detail'] as const;
const PARTNER_TIMESLOTS_KEY = ['partner', 'time-slots'] as const;
const PARTNER_PROGRAM_COUNTS_KEY = ['partner', 'programs', 'reservation-counts'] as const;

function retryExceptAuthOrNotFound(failureCount: number, error: unknown): boolean {
    if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) {
        return false;
    }
    return failureCount < 2;
}

export function useReservationDetail(reservationId: string) {
    return useQuery({
        queryKey: [...KEY, reservationId] as const,
        queryFn: () => getReservationDetail(reservationId),
        retry: retryExceptAuthOrNotFound,
        enabled: Boolean(reservationId),
    });
}

export function useReservationReview(reservationId: string, enabled: boolean) {
    return useQuery({
        queryKey: [...REVIEW_KEY, reservationId] as const,
        queryFn: () => getReservationReview(reservationId),
        retry: retryExceptAuthOrNotFound,
        enabled: enabled && Boolean(reservationId),
    });
}

export function usePartnerReservationCalendar(storeId: string, year: number, month: number) {
    return useQuery({
        queryKey: [...PARTNER_CALENDAR_KEY, storeId, year, month] as const,
        queryFn: () => getPartnerReservationCalendar(storeId, year, month),
        retry: retryExceptAuthOrNotFound,
        enabled: Boolean(storeId) && year > 0 && month > 0,
    });
}

export function usePartnerReservationsByDate(storeId: string, date: string) {
    return useQuery({
        queryKey: [...PARTNER_LIST_KEY, storeId, date] as const,
        queryFn: () => getPartnerReservationsByDate(storeId, date),
        retry: retryExceptAuthOrNotFound,
        enabled: Boolean(storeId) && Boolean(date),
    });
}

export function usePartnerReservationDetail(reservationId: string) {
    return useQuery({
        queryKey: [...PARTNER_DETAIL_KEY, reservationId] as const,
        queryFn: () => getPartnerReservationDetail(reservationId),
        retry: retryExceptAuthOrNotFound,
        enabled: Boolean(reservationId),
    });
}

export function usePartnerTimeSlotsByDate(storeId: string, date: string) {
    return useQuery({
        queryKey: [...PARTNER_TIMESLOTS_KEY, storeId, date] as const,
        queryFn: () => getPartnerTimeSlotsByDate(storeId, date),
        retry: retryExceptAuthOrNotFound,
        enabled: Boolean(storeId) && Boolean(date),
    });
}

export function usePartnerProgramReservationCounts(
    storeId: string,
    date: string,
    timeSlotIds: string[],
    enabled = true,
) {
    return useQuery({
        queryKey: [...PARTNER_PROGRAM_COUNTS_KEY, storeId, date, timeSlotIds.join(',')] as const,
        queryFn: () => getPartnerProgramReservationCounts(storeId, date, timeSlotIds),
        retry: retryExceptAuthOrNotFound,
        enabled: enabled && Boolean(storeId) && Boolean(date) && timeSlotIds.length > 0,
    });
}

export function useCreatePartnerReservationMutation(storeId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: CreatePartnerReservationRequest) =>
            createPartnerReservation(storeId, body),
        onSuccess: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: ['partner', 'reservations'] }),
                queryClient.invalidateQueries({ queryKey: PARTNER_TIMESLOTS_KEY }),
                queryClient.invalidateQueries({ queryKey: PARTNER_PROGRAM_COUNTS_KEY }),
            ]),
    });
}

function useInvalidatePartnerReservationQueries(reservationId: string) {
    const queryClient = useQueryClient();
    return () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: [...PARTNER_DETAIL_KEY, reservationId] }),
            queryClient.invalidateQueries({ queryKey: ['partner', 'reservations'] }),
        ]);
}

export function useConfirmPartnerReservationMutation(reservationId: string) {
    const invalidate = useInvalidatePartnerReservationQueries(reservationId);
    return useMutation({
        mutationFn: () => confirmPartnerReservation(reservationId),
        onSuccess: invalidate,
    });
}

export function useRejectPartnerReservationMutation(reservationId: string) {
    const invalidate = useInvalidatePartnerReservationQueries(reservationId);
    return useMutation({
        mutationFn: (body: RejectPartnerReservationRequest) =>
            rejectPartnerReservation(reservationId, body),
        onSuccess: invalidate,
    });
}

export function useCancelPartnerReservationMutation(reservationId: string) {
    const invalidate = useInvalidatePartnerReservationQueries(reservationId);
    return useMutation({
        mutationFn: (body: CancelPartnerReservationRequest) =>
            cancelPartnerReservation(reservationId, body),
        onSuccess: invalidate,
    });
}

export function useCompletePartnerReservationMutation(reservationId: string) {
    const invalidate = useInvalidatePartnerReservationQueries(reservationId);
    return useMutation({
        mutationFn: () => completePartnerReservation(reservationId),
        onSuccess: invalidate,
    });
}
