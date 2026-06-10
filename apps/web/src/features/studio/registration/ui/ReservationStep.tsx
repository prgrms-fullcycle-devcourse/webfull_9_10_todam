'use client';

import { ReservationFields } from '@/entities/studio';
import { useStudioRegistrationStore } from '../model/studio';

export function ReservationStep() {
    const reservation = useStudioRegistrationStore((s) => s.form.reservation);
    const patchReservation = useStudioRegistrationStore((s) => s.patchReservation);

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
