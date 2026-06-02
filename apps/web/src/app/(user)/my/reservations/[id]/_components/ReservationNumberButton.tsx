'use client';

import { Button, DuplicateIcon } from '@todam/ui';

import { useToast } from '../../../../../../shared/model';

// 예약번호 카드 (outline + duplicate icon + label).
// 디자인 정본 — Figma `c72f7ac4...` outline size=sm type=iconLabel, 328 x 40.
// 클릭 시 예약번호 클립보드 복사 → 토스트.
export type ReservationNumberButtonProps = {
    reservationId: string;
};

// 디자인 라벨 형식 "예약번호 LDM-01234" — 정본 응답엔 별도 단축번호 없음. id 앞 일부 사용.
function formatReservationNumber(id: string): string {
    // res-seed-0001 → "LDM-0001". UUID 면 마지막 8자.
    const short = id.split('-').at(-1)?.slice(-8) ?? id.slice(0, 8);
    return `LDM-${short}`;
}

export function ReservationNumberButton({ reservationId }: ReservationNumberButtonProps) {
    const { push } = useToast();
    const number = formatReservationNumber(reservationId);

    const handleClick = async () => {
        try {
            await navigator.clipboard.writeText(reservationId);
            push({ message: '예약번호를 복사했어요.' });
        } catch {
            push({ message: '예약번호 복사에 실패했어요.' });
        }
    };

    return (
        <Button
            variant="outline"
            layout="iconLabel"
            size="sm"
            icon={<DuplicateIcon />}
            onClick={handleClick}
            className="w-full"
        >
            예약번호 {number}
        </Button>
    );
}
