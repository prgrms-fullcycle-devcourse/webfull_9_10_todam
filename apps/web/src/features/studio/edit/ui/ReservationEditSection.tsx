'use client';

import { ReservationFields } from '@/entities/studio';
import { useStudioEditStore } from '../model/studio';

export function ReservationEditSection() {
    const form = useStudioEditStore((s) => s.form);
    const patchReservation = useStudioEditStore((s) => s.patchReservation);

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
