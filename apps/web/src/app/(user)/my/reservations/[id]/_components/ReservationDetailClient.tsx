'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ReservationDeliveryMethod, ReservationStatus } from '@todam/shared';

import { useReservationDetail } from '@/features/reservation/detail';
import { ApiError } from '@/shared/api';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useModal, useToast } from '@/shared/model';

import { ArtworkStageCard } from './ArtworkStageCard';
import { CancelDialog } from './CancelDialog';
import { DeliveryInfoSection } from './DeliveryInfoSection';
import { MoreMenu } from './MoreMenu';
import { NextStageDescription } from './NextStageDescription';
import { ReservationInfoCard } from './ReservationInfoCard';
import { ReservationNumberButton } from './ReservationNumberButton';
import { ReviewSection } from './ReviewSection';

// status 그룹 helper.
function isBeforeExperience(status: ReservationStatus): boolean {
    return status === ReservationStatus.PENDING || status === ReservationStatus.CONFIRMED;
}
function isInProgress(status: ReservationStatus): boolean {
    return status === ReservationStatus.IN_PROGRESS;
}
function isExperienceDone(status: ReservationStatus): boolean {
    // 체험 완료 후 = IN_PROGRESS 이후 단계 (제작 중 ~ 픽업 완료).
    return [
        ReservationStatus.IN_PROGRESS,
        ReservationStatus.SHIPPED,
        ReservationStatus.DELIVERED,
        ReservationStatus.PICKUP_READY,
        ReservationStatus.PICKUP_DONE,
    ].includes(status);
}

// 예약 상세 클라이언트.
// 서버 컴포넌트(page.tsx) 가 reservationId 만 넘기고 동적 동작은 본 컴포넌트가 캡슐화.
// - react-query useReservationDetail
// - 401 → /login 리다이렉트
// - 403/404 → 안내 메시지
// - 헤더 우측 more 액션 슬롯에 MoreMenu 토글 버튼 등록 (useHeaderActionStore)
// - more 클릭 → MoreMenu 노출, "예약 취소하기" → Modal 표시
export type ReservationDetailClientProps = {
    reservationId: string;
};

export function ReservationDetailClient({ reservationId }: ReservationDetailClientProps) {
    const router = useRouter();
    const { data, error, isLoading, isError } = useReservationDetail(reservationId);
    const { open: openModal, close: closeModal } = useModal();
    const { push: pushToast } = useToast();

    // 401 → /login 리다이렉트 (목록 화면과 동일 패턴).
    useEffect(() => {
        if (isError && error instanceof ApiError && error.statusCode === 401) {
            router.replace('/login');
        }
    }, [isError, error, router]);

    const reservation = data?.reservation;

    // 더보기 메뉴 - 체험 완료 후엔 메뉴 항목 없음 → more 버튼 자체 숨김.
    const showMoreMenu = reservation
        ? isBeforeExperience(reservation.status) ||
          (isExperienceDone(reservation.status) && reservation.canCancel)
        : false;

    const handleCancelClick = () => {
        if (!reservation) return;
        openModal(
            <CancelDialog
                reservation={reservation}
                onClose={closeModal}
                onConfirmCancel={() => {
                    pushToast({ message: '예약 취소는 곧 지원돼요.' });
                }}
                onContactStore={() => {
                    pushToast({ message: '공방 문의 연결은 곧 지원돼요.' });
                }}
            />,
        );
    };

    const handleEditClick = () => {
        pushToast({ message: '예약 수정은 곧 지원돼요.' });
    };

    // 라우트 헤더(예약 자세히보기) 우측 more 메뉴. 메뉴 항목 없으면 미노출(기본값 유지).
    useHeaderOverride({
        rightAction:
            showMoreMenu && reservation ? (
                <MoreMenu
                    reservation={reservation}
                    onEdit={handleEditClick}
                    onCancel={handleCancelClick}
                />
            ) : undefined,
    });

    if (isLoading) {
        return (
            <main className="flex-1 overflow-y-auto px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    예약 상세를 불러오는 중입니다.
                </p>
            </main>
        );
    }

    if (isError && error instanceof ApiError) {
        // 401 은 리다이렉트 처리 — 메시지 분기에서 제외.
        if (error.statusCode === 401) return null;
        const message =
            error.statusCode === 404
                ? '예약을 찾을 수 없습니다.'
                : error.statusCode === 403
                  ? '해당 예약에 대한 접근 권한이 없습니다.'
                  : '예약 상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
        return (
            <main className="flex-1 overflow-y-auto px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">{message}</p>
            </main>
        );
    }

    if (!reservation) {
        return (
            <main className="flex-1 overflow-y-auto px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    예약 정보를 불러오지 못했습니다.
                </p>
            </main>
        );
    }

    const isDelivery = reservation.deliveryMethod === ReservationDeliveryMethod.DELIVERY;

    return (
        <main className="flex-1 overflow-y-auto px-4 pb-16">
            <div className="flex flex-col gap-2 py-2">
                <ReservationInfoCard reservation={reservation} />
                <ReservationNumberButton reservationId={reservation.id} />

                {/* 변형 A — 체험 전: 다음 단계 안내 */}
                {isBeforeExperience(reservation.status) && <NextStageDescription />}

                {/* 작품 제작 단계 (IN_PROGRESS 시 노출) */}
                {isInProgress(reservation.status) && <ArtworkStageCard reservation={reservation} />}

                {/* 배송 정보 (DELIVERY 시 노출) */}
                {isDelivery && <DeliveryInfoSection reservation={reservation} />}

                {/* 리뷰 (체험 완료 후 노출) */}
                {isExperienceDone(reservation.status) && (
                    <ReviewSection reservation={reservation} />
                )}
            </div>
        </main>
    );
}
