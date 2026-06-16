'use client';

import { ProgramRegistrationFlow } from '@/features/program/registration';
import { useCurrentStudioId } from '@/entities/studio';

export default function PartnerClassNewPage() {
    const storeId = useCurrentStudioId();

    if (!storeId) return null;

    const returnTo = '/partner/classes';
    return (
        <ProgramRegistrationFlow
            storeId={storeId}
            returnTo={returnTo}
            successReturnTo="/partner/studio?backTo=/partner/settings"
        />
    );
}
