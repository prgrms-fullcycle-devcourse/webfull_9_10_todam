'use client';

import { OperatingFields } from '@/features/store/shared/ui';
import { useStoreRegistrationStore } from '../model/store';

export function OperatingStep() {
    const operating = useStoreRegistrationStore((s) => s.form.operating);
    const convenienceInfo = useStoreRegistrationStore((s) => s.form.store.convenienceInfo);
    const patchOperating = useStoreRegistrationStore((s) => s.patchOperating);
    const toggleBusinessDay = useStoreRegistrationStore((s) => s.toggleBusinessDay);
    const toggleConvenience = useStoreRegistrationStore((s) => s.toggleConvenience);

    return (
        <OperatingFields
            operating={operating}
            convenienceInfo={convenienceInfo}
            onPatchOperating={patchOperating}
            onToggleBusinessDay={toggleBusinessDay}
            onToggleConvenience={toggleConvenience}
        />
    );
}
