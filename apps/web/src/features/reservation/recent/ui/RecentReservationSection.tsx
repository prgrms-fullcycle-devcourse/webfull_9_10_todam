'use client';

import Link from 'next/link';

import { formatScheduled, type ReservationListItem } from '@todam/shared';

import { ReservationStatusBadge } from '@/entities/reservation';
import { EmptyState } from '@/shared/ui';

import { useRecentReservation } from '../queries';

// 상태 메시지는 displayState 내용이 있을 때만 노출 (contract: displayState 렌더).
// 상태별(종료 등) 숨김 규칙은 plan/contract에 없음 — 데이터 유무로만 판단.
function hasStatusMessage(item: ReservationListItem): boolean {
    return Boolean(item.displayState.description.trim() || item.displayState.subLabel);
}

// 최근 예약 위젯 카드 — 카드 전체를 Link 로 래핑(plan §상태별 CTA — 없음 확정).
// 별도 CTA 버튼 컴포넌트는 렌더하지 않는다.
function RecentReservationCard({ item }: { item: ReservationListItem }) {
    const { date, day, time } = formatScheduled(item.scheduledAt);
    const showMessage = hasStatusMessage(item);

    return (
        <Link
            href={`/my/reservations/${item.id}`}
            className="flex w-full flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-4 text-left"
        >
            <div className="flex flex-col gap-2">
                {/* 행 1: date·day + 우측 배지 */}
                <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center gap-1">
                        <span className="text-base font-semibold text-foreground">{date}</span>
                        <span className="text-base text-foreground-tertiary">{day}</span>
                    </div>
                    <ReservationStatusBadge status={item.status} label={item.displayState.label} />
                </div>

                {/* 행 2: programTitle + meta(storeName・hh:mm) */}
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">{item.programTitle}</p>
                    <p className="text-xs text-foreground-tertiary">
                        {item.storeName}・{time}
                    </p>
                </div>
            </div>

            {/* 행 3: status message (옵션). displayState.description·subLabel 그대로 렌더. */}
            {showMessage && (
                <div className="flex h-8 items-center rounded-lg bg-muted px-3">
                    <p className="text-xs font-semibold text-foreground-secondary">
                        {item.displayState.description}
                        {item.displayState.subLabel ? ` · ${item.displayState.subLabel}` : ''}
                    </p>
                </div>
            )}
        </Link>
    );
}

// 메인 화면 최근 예약 섹션.
// contract: docs/exec-plans/active/최근 예약 조회.md
// - 인증 사용자 + 최신 예약 1건 표시
// - 401(비회원) / 예약없음 / 500 오류 분기
// - 카드 전체 클릭 → 예약 상세(/my/reservations/{id})
export function RecentReservationSection() {
    const state = useRecentReservation();

    return (
        <section className="flex flex-col gap-3 py-2">
            {/* 섹션 헤더 */}
            <h2 className="text-lg font-semibold text-foreground">최근 예약</h2>

            {/* 로딩 */}
            {state.kind === 'loading' && (
                <p className="py-6 text-center text-sm text-foreground-tertiary">
                    최근 예약을 불러오는 중입니다.
                </p>
            )}

            {/* 오류 */}
            {state.kind === 'error' && (
                <p className="py-6 text-center text-sm text-foreground-tertiary">
                    예약 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                </p>
            )}

            {/* 비회원 */}
            {state.kind === 'guest' && (
                <EmptyState message="로그인 후 최근 예약을 확인할 수 있어요." />
            )}

            {/* 예약 없음 */}
            {state.kind === 'empty' && <EmptyState message="아직 예약 내역이 없습니다." />}

            {/* 최신 예약 1건 카드 */}
            {state.kind === 'data' && <RecentReservationCard item={state.item} />}
        </section>
    );
}
