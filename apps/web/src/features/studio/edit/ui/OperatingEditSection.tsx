'use client';

import { OperatingFields } from '@/entities/studio';
import { useStudioEditStore } from '../model/studio';

export function OperatingEditSection() {
    const form = useStudioEditStore((s) => s.form);
    const patchOperating = useStudioEditStore((s) => s.patchOperating);
    const toggleBusinessDay = useStudioEditStore((s) => s.toggleBusinessDay);
    const toggleConvenience = useStudioEditStore((s) => s.toggleConvenience);

    if (!form) return null;

    return (
        <OperatingFields
            operating={form.operating}
            convenienceInfo={form.store.convenienceInfo}
            onPatchOperating={patchOperating}
            onToggleBusinessDay={toggleBusinessDay}
            onToggleConvenience={toggleConvenience}
        />
    );
}
