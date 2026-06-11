import type { BusinessState, StoreStatus, VerificationStatus } from '@todam/shared';
import { Badge } from '@todam/ui';

import {
    BUSINESS_STATE_LABEL,
    BUSINESS_STATE_TONE,
    STORE_STATUS_LABEL,
    STORE_STATUS_TONE,
    VERIFICATION_STATUS_LABEL,
    VERIFICATION_STATUS_TONE,
} from '../model/labels';

export function StoreStatusBadge({ status }: { status: StoreStatus }) {
    return <Badge tone={STORE_STATUS_TONE[status]}>{STORE_STATUS_LABEL[status]}</Badge>;
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
    return (
        <Badge tone={VERIFICATION_STATUS_TONE[status]}>{VERIFICATION_STATUS_LABEL[status]}</Badge>
    );
}

export function BusinessStateBadge({ state }: { state: BusinessState }) {
    return <Badge tone={BUSINESS_STATE_TONE[state]}>{BUSINESS_STATE_LABEL[state]}</Badge>;
}
