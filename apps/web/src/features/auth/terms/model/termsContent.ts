/** 약관 종류 식별자. UI 표시용 키이며, 서버 연동 시 PolicyType 매핑은 별도 단계에서 결정. */
export type TermsKey = 'service' | 'location' | 'privacy';

/** 부모로 전달할 동의 결과(연동 단계에서 사용). */
export type TermsAgreement = Record<TermsKey, boolean>;

export type TermsItem = {
    key: TermsKey;
    label: string;
    /** 필수 약관 여부. 필수가 모두 동의돼야 확인 버튼 활성. */
    required: boolean;
    /** 노션 약관 페이지 URL (새 탭으로 열림). */
    notionUrl: string;
};

// 디자인(image/login2.png) 기준 약관 3종.
// NOTE(contract mismatch): API contract(이메일-회원가입.md)는 termsAgreed/privacyAgreed 2개 boolean,
// PolicyType enum도 PRIVACY_POLICY | TERMS_OF_SERVICE | MARKETING 뿐이라
// "위치기반 서비스 이용약관(location)"에 대응하는 필드/타입이 없다.
// → UI는 디자인대로 3종 유지. 연동 전 contract 보완(재plan) 필요. (plan Risks 참고)
//
// 위치정보법 제18조: 위치정보 수집 동의는 다른 필수 동의와 분리된 선택 동의여야 함.
// location을 required: true로 두면 서비스 이용 자체를 위치 동의와 묶는 것이 되어 법 위반.
export const TERMS: readonly TermsItem[] = [
    {
        key: 'service',
        label: '서비스 이용약관',
        required: true,
        // TODO: 실제 노션 약관 페이지 URL로 교체
        notionUrl: 'https://www.notion.so/service-terms',
    },
    {
        key: 'privacy',
        label: '개인정보 수집 · 이용 동의',
        required: true,
        // TODO: 실제 노션 약관 페이지 URL로 교체
        notionUrl: 'https://www.notion.so/privacy-policy',
    },
    {
        key: 'location',
        label: '위치기반 서비스 이용약관',
        required: true,
        // TODO: 실제 노션 약관 페이지 URL로 교체
        notionUrl: 'https://www.notion.so/location-terms',
    },
] as const;
