'use client';

import { OperatingFields } from '@/entities/studio';
import { useStudioRegistrationStore } from '../model/studio';

export function OperatingStep() {
    const operating = useStudioRegistrationStore((s) => s.form.operating);
    const convenienceInfo = useStudioRegistrationStore((s) => s.form.store.convenienceInfo);
    const patchOperating = useStudioRegistrationStore((s) => s.patchOperating);
    const toggleBusinessDay = useStudioRegistrationStore((s) => s.toggleBusinessDay);
    const toggleConvenience = useStudioRegistrationStore((s) => s.toggleConvenience);

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
