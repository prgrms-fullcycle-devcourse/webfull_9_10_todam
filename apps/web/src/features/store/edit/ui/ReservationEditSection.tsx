'use client';

import { ReservationFields } from '@/features/store/shared/ui';
import { useStoreEditStore } from '../model/store';

export function ReservationEditSection() {
    const form = useStoreEditStore((s) => s.form);
    const patchReservation = useStoreEditStore((s) => s.patchReservation);

    if (!form) return null;
    const reservation = form.reservation;

    return (
        <ReservationFields
            intervalMinutes={reservation.intervalMinutes}
            cancelDeadlineDays={reservation.cancelDeadlineDays}
            maxCapacity={reservation.maxCapacity}
            autoConfirm={reservation.autoConfirm}
            onChangeInterval={(intervalMinutes) => patchReservation({ intervalMinutes })}
            onChangeCancelDeadline={(cancelDeadlineDays) =>
                patchReservation({ cancelDeadlineDays })
            }
            onChangeMaxCapacity={(maxCapacity) => patchReservation({ maxCapacity })}
            onChangeAutoConfirm={(autoConfirm) => patchReservation({ autoConfirm })}
        />
    );
}
