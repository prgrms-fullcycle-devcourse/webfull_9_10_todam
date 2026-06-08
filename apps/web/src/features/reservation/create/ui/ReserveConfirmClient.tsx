'use client';

import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ReservationDeliveryMethod, ReservationStatus, formatPrice } from '@todam/shared';
import type { CreateUserReservationResult } from '@todam/shared';
import { Button } from '@todam/ui';

// sessionStorage 키 (ReserveClient 에서 저장)
const SS_KEY = 'todam_reservation_result';

type ReservationSnapshot = CreateUserReservationResult['reservation'];

// ReserveClient 가 저장하는 완료 스냅샷 — 응답(reservation)에 없는 표시용 메타를 함께 담는다.
interface ReservationResultPayload {
    reservation: ReservationSnapshot;
    meta?: {
        programTitle?: string;
        startAt?: string;
        endAt?: string;
        participantCount?: number;
        totalPrice?: number;
        deliveryMethod?: ReservationDeliveryMethod;
    };
}

function ResultRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between text-sm">
            <span className="text-foreground-tertiary">{label}</span>
            <span className="text-right text-foreground">{value}</span>
        </div>
    );
}

export function ReserveConfirmClient() {
    const router = useRouter();
    const [payload, setPayload] = useState<ReservationResultPayload | null>(null);

    // sessionStorage 는 클라이언트 전용 외부 저장소다. lazy useState 초기화로 읽으면
    // 서버 렌더(null) ↔ 클라 렌더(값) 하이드레이션 불일치가 나므로, 의도적으로 mount 후
    // effect 에서 동기화한다(서버=클라 첫 렌더 모두 null → mount 시 갱신, mismatch 없음).
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const timer = window.setTimeout(() => {
            try {
                const raw = sessionStorage.getItem(SS_KEY);
                if (raw) {
                    setPayload(JSON.parse(raw) as ReservationResultPayload);
                    // 읽은 뒤 제거 — 새로고침 시 오래된 데이터 표시 방지
                    sessionStorage.removeItem(SS_KEY);
                }
            } catch {
                // 파싱 실패 시 null 유지
            }
        }, 0);

        return () => window.clearTimeout(timer);
    }, []);

    if (!payload) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-20">
                <p className="text-sm text-foreground-tertiary">예약 정보를 불러올 수 없습니다.</p>
                <Button variant="outline" onClick={() => router.push('/my/reservations')}>
                    내 예약 보기
                </Button>
            </div>
        );
    }

    const { reservation, meta } = payload;
    const isConfirmed = reservation.status === ReservationStatus.CONFIRMED;

    const slotText =
        meta?.startAt && meta?.endAt
            ? `${format(new Date(meta.startAt), 'yyyy. M. d')} ${format(new Date(meta.startAt), 'HH:mm')} – ${format(new Date(meta.endAt), 'HH:mm')}`
            : null;
    const deliveryText =
        meta?.deliveryMethod === ReservationDeliveryMethod.DELIVERY
            ? '택배로 받기'
            : '직접 가져가기';

    return (
        <div className="flex flex-col items-center gap-8 px-4 pb-16 pt-10">
            {/* 상태 히어로 */}
            <div className="flex flex-col items-center gap-4 text-center">
                <div
                    className={[
                        'flex size-16 items-center justify-center rounded-full',
                        isConfirmed ? 'bg-success-subtle' : 'bg-primary-subtle',
                    ].join(' ')}
                >
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
                        <path
                            d="M6 16L13 23L26 9"
                            stroke={isConfirmed ? 'var(--color-success)' : 'var(--color-primary)'}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <div className="flex flex-col gap-1">
                    <p className="text-xl font-bold text-foreground">
                        {isConfirmed ? '체험 예약이 완료되었어요' : '예약 신청이 접수되었어요'}
                    </p>
                    <p className="text-sm leading-relaxed text-foreground-secondary">
                        {reservation.displayState.description}
                    </p>
                    {!isConfirmed && (
                        <p className="text-xs text-foreground-tertiary">
                            작가님이 예약을 확인하면 바로 알려드릴게요.
                        </p>
                    )}
                </div>
            </div>

            {/* 예약 결과 표 */}
            <div className="flex w-full flex-col gap-2 rounded-2xl border border-border-subtle bg-surface px-4 py-4">
                {meta?.programTitle && <ResultRow label="클래스" value={meta.programTitle} />}
                {slotText && <ResultRow label="체험 일시" value={slotText} />}
                <ResultRow
                    label="인원"
                    value={`${meta?.participantCount ?? reservation.participantCount}명`}
                />
                <ResultRow label="예약자" value={reservation.reserverName} />
                {typeof meta?.totalPrice === 'number' && (
                    <ResultRow label="결제 금액" value={formatPrice(meta.totalPrice)} />
                )}
                <ResultRow label="작품 수령" value={deliveryText} />
                <div className="mt-1 flex justify-between border-t border-border-subtle pt-2 text-sm">
                    <span className="text-foreground-tertiary">예약 번호</span>
                    <span className="font-mono text-xs text-foreground">{reservation.id}</span>
                </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex w-full flex-col gap-2">
                <Button className="w-full" onClick={() => router.push('/my/reservations')}>
                    내 예약 보기
                </Button>
                <Button className="w-full" variant="outline" onClick={() => router.push('/')}>
                    홈으로
                </Button>
            </div>
        </div>
    );
}
