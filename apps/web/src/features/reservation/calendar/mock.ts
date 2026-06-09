/**
 * Mock 데이터 — 타입은 @todam/shared contract(reservation-calendar) SSOT.
 * shape 정의는 contract, 본 파일은 mock 데이터만. API 연동 시 이 파일만 교체.
 *
 * GET /partner/stores/{storeId}/reservations/calendar
 * GET /partner/stores/{storeId}/reservations?date=
 */

import { ReservationStatus } from '@todam/shared';
import type { CalendarData, ReservationListData } from '@todam/shared';

// ─── 2026년 6월 캘린더 mock ────────────────────────────────────────────────

export const mockCalendarData: CalendarData = {
    year: 2026,
    month: 6,
    days: [
        {
            date: '2026-06-01',
            hasReservation: true,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 3,
        },
        {
            date: '2026-06-02',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-03',
            hasReservation: false,
            isUnavailable: true,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-04',
            hasReservation: true,
            isUnavailable: false,
            hasRestriction: true,
            reservationCount: 1,
        },
        {
            date: '2026-06-05',
            hasReservation: true,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 2,
        },
        {
            date: '2026-06-06',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-07',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-08',
            hasReservation: true,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 4,
        },
        {
            date: '2026-06-09',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-10',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-11',
            hasReservation: true,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 2,
        },
        {
            date: '2026-06-12',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-13',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: true,
            reservationCount: 0,
        },
        {
            date: '2026-06-14',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-15',
            hasReservation: true,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 5,
        },
        {
            date: '2026-06-16',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-17',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-18',
            hasReservation: true,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 1,
        },
        {
            date: '2026-06-19',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-20',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-21',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-22',
            hasReservation: true,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 3,
        },
        {
            date: '2026-06-23',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-24',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-25',
            hasReservation: true,
            isUnavailable: false,
            hasRestriction: true,
            reservationCount: 2,
        },
        {
            date: '2026-06-26',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-27',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-28',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
        {
            date: '2026-06-29',
            hasReservation: true,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 1,
        },
        {
            date: '2026-06-30',
            hasReservation: false,
            isUnavailable: false,
            hasRestriction: false,
            reservationCount: 0,
        },
    ],
};

// ─── 일별 예약 목록 mock (날짜별 맵) ──────────────────────────────────────────

const mockReservationsByDate: Record<string, ReservationListData> = {
    '2026-06-01': {
        reservations: [
            {
                id: 'res-uuid-001',
                programTitle: '물레 체험 기초반',
                durationMinutes: 120,
                scheduledAt: '2026-06-01T10:00:00.000Z',
                reserverName: '김지은',
                participantCount: 2,
                status: ReservationStatus.CONFIRMED,
                source: 'CUSTOMER',
                createdAt: '2026-05-25T19:35:00.000Z',
            },
            {
                id: 'res-uuid-002',
                programTitle: '핀치팟 체험 입문',
                durationMinutes: 90,
                scheduledAt: '2026-06-01T14:00:00.000Z',
                reserverName: '박민준',
                participantCount: 1,
                status: ReservationStatus.PENDING,
                source: 'CUSTOMER',
                createdAt: '2026-05-26T09:10:00.000Z',
            },
            {
                id: 'res-uuid-003',
                programTitle: '물레 체험 기초반',
                durationMinutes: 120,
                scheduledAt: '2026-06-01T16:00:00.000Z',
                reserverName: '이수현',
                participantCount: 3,
                status: ReservationStatus.CANCELED,
                source: 'CUSTOMER',
                createdAt: '2026-05-24T11:00:00.000Z',
            },
        ],
        nextCursor: null,
        hasMore: false,
    },
    '2026-06-05': {
        reservations: [
            {
                id: 'res-uuid-004',
                programTitle: '물레 체험 기초반',
                durationMinutes: 120,
                scheduledAt: '2026-06-05T10:00:00.000Z',
                reserverName: '최예진',
                participantCount: 2,
                status: ReservationStatus.CONFIRMED,
                source: 'CUSTOMER',
                createdAt: '2026-05-30T15:20:00.000Z',
            },
            {
                id: 'res-uuid-005',
                programTitle: '슬라브 핸드빌딩 심화',
                durationMinutes: 150,
                scheduledAt: '2026-06-05T13:00:00.000Z',
                reserverName: '정하늘',
                participantCount: 1,
                status: ReservationStatus.PENDING,
                source: 'PARTNER_MANUAL',
                createdAt: '2026-06-01T08:00:00.000Z',
            },
        ],
        nextCursor: null,
        hasMore: false,
    },
    '2026-06-08': {
        reservations: [
            {
                id: 'res-uuid-006',
                programTitle: '물레 체험 기초반',
                durationMinutes: 120,
                scheduledAt: '2026-06-08T10:00:00.000Z',
                reserverName: '강동욱',
                participantCount: 4,
                status: ReservationStatus.IN_PROGRESS, // 체험완료 처리 → BE status IN_PROGRESS (complete 잠정)
                source: 'CUSTOMER',
                createdAt: '2026-06-01T12:00:00.000Z',
            },
            {
                id: 'res-uuid-007',
                programTitle: '핀치팟 체험 입문',
                durationMinutes: 90,
                scheduledAt: '2026-06-08T13:00:00.000Z',
                reserverName: '윤지혜',
                participantCount: 2,
                status: ReservationStatus.CONFIRMED,
                source: 'CUSTOMER',
                createdAt: '2026-06-02T10:30:00.000Z',
            },
            {
                id: 'res-uuid-008',
                programTitle: '슬라브 핸드빌딩 심화',
                durationMinutes: 150,
                scheduledAt: '2026-06-08T15:00:00.000Z',
                reserverName: '임서준',
                participantCount: 1,
                status: ReservationStatus.CANCELED, // 거절 → BE status CANCELED 통합 (D-REJECT 잠정)
                source: 'CUSTOMER',
                createdAt: '2026-06-03T09:00:00.000Z',
            },
            {
                id: 'res-uuid-009',
                programTitle: '물레 체험 기초반',
                durationMinutes: 120,
                scheduledAt: '2026-06-08T17:00:00.000Z',
                reserverName: '한소희',
                participantCount: 2,
                status: ReservationStatus.PENDING,
                source: 'CUSTOMER',
                createdAt: '2026-06-04T14:00:00.000Z',
            },
        ],
        nextCursor: null,
        hasMore: false,
    },
    '2026-06-15': {
        reservations: [
            {
                id: 'res-uuid-010',
                programTitle: '물레 체험 기초반',
                durationMinutes: 120,
                scheduledAt: '2026-06-15T10:00:00.000Z',
                reserverName: '조민서',
                participantCount: 5,
                status: ReservationStatus.CONFIRMED,
                source: 'CUSTOMER',
                createdAt: '2026-06-08T10:00:00.000Z',
            },
        ],
        nextCursor: null,
        hasMore: false,
    },
    '2026-06-25': {
        reservations: [
            {
                id: 'res-uuid-011',
                programTitle: '핀치팟 체험 입문',
                durationMinutes: 90,
                scheduledAt: '2026-06-25T11:00:00.000Z',
                reserverName: '신은비',
                participantCount: 2,
                status: ReservationStatus.CONFIRMED,
                source: 'CUSTOMER',
                createdAt: '2026-06-18T09:00:00.000Z',
            },
            {
                id: 'res-uuid-012',
                programTitle: '슬라브 핸드빌딩 심화',
                durationMinutes: 150,
                scheduledAt: '2026-06-25T14:00:00.000Z',
                reserverName: '오준혁',
                participantCount: 1,
                status: ReservationStatus.PENDING,
                source: 'CUSTOMER',
                createdAt: '2026-06-20T16:00:00.000Z',
            },
        ],
        nextCursor: null,
        hasMore: false,
    },
};

/** 날짜(YYYY-MM-DD)로 mock 예약 목록 조회 */
export function getMockReservationsByDate(date: string): ReservationListData {
    return (
        mockReservationsByDate[date] ?? {
            reservations: [],
            nextCursor: null,
            hasMore: false,
        }
    );
}
