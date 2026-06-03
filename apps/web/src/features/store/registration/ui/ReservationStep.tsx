'use client';

import { ReservationFields } from '@/features/store/shared/ui';
import { useStoreRegistrationStore } from '../model/store';

export function ReservationStep() {
    const reservation = useStoreRegistrationStore((s) => s.form.reservation);
    const patchReservation = useStoreRegistrationStore((s) => s.patchReservation);

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
