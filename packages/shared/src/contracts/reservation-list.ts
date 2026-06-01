import { z } from 'zod';

import { ReservationStatus } from '../enums/reservation-status';

// ─── 나의 예약 목록 조회 (GET /reservations/me) ──────────────────────────────
// 정본(Notion API명세 DB) 기준. docs/exec-plans/active/user-예약-나의 예약조회.md 의
// "API Contract (스냅샷)" 섹션과 1:1로 바인딩한다. 임의 변경 금지.

// limit 기본값: 공통 상수 `DEFAULT_PAGE_SIZE`(20) 사용.
// (PR #51 리뷰: nogglee — packages/shared 기준으로 정렬. Notion 정본의 "기본값 10" 보다
//  팀 공통 상수를 우선. Open decision 4 해소.)
export { DEFAULT_PAGE_SIZE as RESERVATION_LIST_DEFAULT_LIMIT } from '../constants/pagination';

// 서버가 Reservation.status (+ IN_PROGRESS 구간엔 Artwork.status) 로 파생 계산한
// 표시용 상태. FE 는 label/description/subLabel 을 그대로 렌더링하고 status enum 만
// 배지의 색·아이콘 결정에 사용한다.
export const displayStateSchema = z.object({
    label: z.string(),
    description: z.string(),
    subLabel: z.string().nullable(),
});
export type DisplayState = z.infer<typeof displayStateSchema>;

export const reservationListItemSchema = z.object({
    id: z.string(),
    storeName: z.string(),
    programTitle: z.string(),
    scheduledAt: z.string(), // ISO 8601
    participantCount: z.number().int().nonnegative(),
    status: z.nativeEnum(ReservationStatus),
    displayState: displayStateSchema,
    createdAt: z.string(), // ISO 8601
});
export type ReservationListItem = z.infer<typeof reservationListItemSchema>;

// 커서 페이지네이션 공통 형태. items 의 키 이름은 엔드포인트별로 다르므로
// (예: `/reservations/me` 는 `reservations`) 여기선 제네릭 헬퍼만 제공.
export type CursorPage<TItem, TKey extends string = 'items'> = {
    [K in TKey]: TItem[];
} & {
    nextCursor: string | null;
    hasMore: boolean;
};

export const reservationListResultSchema = z.object({
    reservations: z.array(reservationListItemSchema),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
});
export type ReservationListResult = z.infer<typeof reservationListResultSchema>;
