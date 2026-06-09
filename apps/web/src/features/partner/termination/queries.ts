'use client';

import { useMutation } from '@tanstack/react-query';

import { terminatePartner } from './api';

// DELETE /partners/me — 성공 후 캐시/인증 처리는 호출부(onSuccess)에서 수행.
export function useTerminatePartner() {
    return useMutation({ mutationFn: terminatePartner });
}
