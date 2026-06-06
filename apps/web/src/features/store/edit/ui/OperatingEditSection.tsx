'use client';

import { OperatingFields } from '@/entities/store';
import { useStoreEditStore } from '../model/store';

export function OperatingEditSection() {
    const form = useStoreEditStore((s) => s.form);
    const patchOperating = useStoreEditStore((s) => s.patchOperating);
    const toggleBusinessDay = useStoreEditStore((s) => s.toggleBusinessDay);
    const toggleConvenience = useStoreEditStore((s) => s.toggleConvenience);

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
