// 예약 정보 바텀시트.
// shared/ui ResultTable 재사용.
// Decision Log D4: 예약정보 바텀시트는 클래스명, 예약번호, 날짜, 시간, 인원, 예약자, 연락처, 내부 메모.

import type { GetPartnerArtworkDetailResult } from '@todam/shared';
import { formatScheduled, formatYmdWithDay } from '@todam/shared';
import { StandardBottomSheet } from '@todam/ui';
import { ResultTable } from '@/shared/ui';
import { useSheet } from '@/shared/model';

type ReservationInfo = GetPartnerArtworkDetailResult['artwork']['reservation'];

export type PartnerReservationInfoSheetProps = {
    reservation: ReservationInfo;
};

export function PartnerReservationInfoSheet({ reservation }: PartnerReservationInfoSheetProps) {
    const { close } = useSheet();

    const rows = [
        { label: '날짜', value: formatYmdWithDay(reservation.scheduledAt) },
        { label: '시간', value: formatScheduled(reservation.scheduledAt).time },
        { label: '인원', value: `${reservation.participantCount}명` },
        { label: '예약자', value: reservation.reserverName },
        { label: '연락처', value: reservation.reserverPhone },
    ];

    return (
        <StandardBottomSheet actionLabel="닫기" onAction={close} actionVariant="ghost">
            <div className="flex flex-col gap-4">
                <ResultTable
                    title={reservation.programTitle}
                    storeName={`예약번호 ${reservation.reservationNumber}`}
                    rows={rows}
                    background="bg-background"
                />

                {reservation.internalMemo && (
                    <div className="rounded-2xl bg-background px-4 py-3">
                        <p className="text-xs text-foreground-tertiary">내부 메모</p>
                        <p className="mt-1 text-sm text-foreground">{reservation.internalMemo}</p>
                    </div>
                )}
            </div>
        </StandardBottomSheet>
    );
}
