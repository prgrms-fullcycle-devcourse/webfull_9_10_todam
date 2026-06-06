'use client';

import { ProgramRegistrationFlow } from '@/features/program/registration';
import { useCurrentStoreId } from '@/entities/store';

export default function PartnerClassNewPage() {
    const storeId = useCurrentStoreId();

    if (!storeId) return null;

    const returnTo = '/partner/classes';
    return <ProgramRegistrationFlow storeId={storeId} returnTo={returnTo} />;
}
