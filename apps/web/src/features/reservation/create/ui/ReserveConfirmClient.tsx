'use client';

import {
    ReservationDeliveryMethod,
    formatPrice,
    formatScheduledRange,
    formatYmdWithDay,
} from '@todam/shared';
import type { CreateUserReservationResult } from '@todam/shared';
import {
    BottomBar,
    Button,
    CalendarIcon,
    CheckIcon,
    ClockIcon,
    CloseIcon,
    FlagIcon,
    NametagIcon,
    UserIcon,
} from '@todam/ui';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { usePublicProgramDetail } from '@/entities/program';
import { ResultTable, type ResultTableRow } from '@/shared/ui';

// sessionStorage 키 (ReserveClient 에서 저장)
const SS_KEY = 'todam_reservation_result';

type ReservationSnapshot = CreateUserReservationResult['reservation'];

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

export function ReserveConfirmClient() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const [payload, setPayload] = useState<ReservationResultPayload | null>(null);

    // 공방명(헤더/요약용) — 예약 응답에 없어 클래스 상세에서 파생.
    const { data: detail } = usePublicProgramDetail(params.id);
    const storeName = detail?.program?.storeName;

    // sessionStorage 는 클라 전용 외부 저장소 → mount 후 effect 동기화(하이드레이션 mismatch 방지).
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
    const deliveryText =
        meta?.deliveryMethod === ReservationDeliveryMethod.DELIVERY
            ? '택배로 받기'
            : '직접 가져가기';

    // 시작·종료 시각은 백엔드 생성 응답 기준(SSOT). 종료 = 시작 + 코스 소요 시간을
    // 백엔드가 이미 계산해 내려준다. (구버전 sessionStorage 페이로드 호환용 meta 폴백.)
    const startAt = reservation.scheduledAt ?? meta?.startAt;
    const endAt = reservation.scheduledEndAt ?? meta?.endAt;

    const rows: ResultTableRow[] = [];
    if (startAt) {
        rows.push({
            label: '날짜',
            value: formatYmdWithDay(startAt),
            icon: <CalendarIcon size={16} />,
        });
        rows.push({
            label: '시간',
            value: formatScheduledRange(startAt, endAt),
            icon: <ClockIcon size={16} />,
        });
    }
    rows.push({
        label: '인원',
        value: `${meta?.participantCount ?? reservation.participantCount}명`,
        icon: <UserIcon size={16} />,
    });
    if (typeof meta?.totalPrice === 'number') {
        rows.push({
            label: '결제',
            value: formatPrice(meta.totalPrice),
            icon: <NametagIcon size={16} />,
        });
    }
    rows.push({ label: '작품 수령', value: deliveryText, icon: <FlagIcon size={16} /> });

    return (
        <>
            <main className="flex-1 overflow-y-auto">
                {/* 히어로 */}
                <section
                    className="relative flex flex-col items-center gap-7 px-4 pb-2 pt-20"
                    style={{
                        background:
                            'linear-gradient(180deg, rgba(125,194,132,0.6) 0%, rgba(255,255,255,0) 100%)',
                    }}
                >
                    <Button
                        variant="ghost"
                        layout="onlyIcon"
                        size="lg"
                        icon={<CloseIcon />}
                        aria-label="닫기"
                        onClick={() => router.push('/')}
                        className="absolute right-2 top-2 hover:!bg-transparent"
                    />
                    <div className="flex size-16 items-center justify-center rounded-full bg-success text-foreground-inverse">
                        <CheckIcon size={24} />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <h1 className="text-2xl font-extrabold text-foreground">
                            체험 예약이 완료되었어요
                        </h1>
                        <p className="text-sm text-foreground-secondary">
                            작가님이 예약을 확인하면 바로 알려드릴게요
                        </p>
                    </div>
                </section>

                {/* 예약 정보 */}
                <div className="px-4 py-2">
                    <ResultTable
                        title={meta?.programTitle ?? detail?.program?.title ?? '클래스'}
                        storeName={storeName}
                        rows={rows}
                    />
                </div>
            </main>

            <BottomBar>
                <div className="flex w-full gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => router.push('/')}>
                        홈으로
                    </Button>
                    <Button className="flex-1" onClick={() => router.push('/my/reservations')}>
                        내 예약 보기
                    </Button>
                </div>
            </BottomBar>
        </>
    );
}
