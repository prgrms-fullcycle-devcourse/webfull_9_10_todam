import { type PartnerProgramListItem } from '@todam/shared';

import { apiFetch } from '../../../shared/api';

const BASE = '/api/v1/partner';

// 디자인 서브텍스트("난이도・소요시간・평균제작일")용 mock 확장 필드.
// Contract(PartnerProgramListItem)에는 없는 level/leadTimeDays 를 mock 응답에서만 보강한다.
// 실 API 연동 시 BE 가 해당 필드를 제공하지 않으면 서브텍스트 포맷을 Contract 필드로 축소한다.
export type PartnerProgramListItemView = PartnerProgramListItem & {
    level?: string;
    leadTimeDays?: number;
};

export type PartnerProgramListResultView = {
    programs: PartnerProgramListItemView[];
};

// 파트너 클래스(프로그램) 목록 조회.
export function getPartnerPrograms(storeId: string) {
    return apiFetch<PartnerProgramListResultView>(`${BASE}/stores/${storeId}/programs`, {
        method: 'GET',
    });
}
