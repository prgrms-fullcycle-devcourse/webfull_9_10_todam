import { type PartnerProgramListItem } from '@todam/shared';

import { apiFetch } from '@/shared/api';

const BASE = '/partner';

export type PartnerProgramListItemView = PartnerProgramListItem;

export type PartnerProgramListResultView = {
    programs: PartnerProgramListItemView[];
};

// 파트너 클래스(프로그램) 목록 조회.
export function getPartnerPrograms(storeId: string) {
    return apiFetch<PartnerProgramListResultView>(`${BASE}/stores/${storeId}/programs`, {
        method: 'GET',
    });
}
