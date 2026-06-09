import { clientApiFetch } from '@/shared/api';
import type { TerminatePartnerResult } from '@todam/shared';

// DELETE /partners/me — 파트너 자율 해지. 성공 시 data=null.
export function terminatePartner() {
    return clientApiFetch<TerminatePartnerResult>('/partners/me', { method: 'DELETE' });
}
