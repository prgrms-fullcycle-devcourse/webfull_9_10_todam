/** 약관 종류 식별자. BE PolicyType 매핑: service→TERMS_OF_SERVICE, privacy→PRIVACY_POLICY, location→LOCATION_BASED_SERVICE. */
export type TermsKey = 'service' | 'location' | 'privacy';

/** 부모로 전달할 동의 결과(연동 단계에서 사용). */
export type TermsAgreement = Record<TermsKey, boolean>;

export type TermsItem = {
    key: TermsKey;
    label: string;
    /** 필수 약관 여부. 필수가 모두 동의돼야 확인 버튼 활성. */
    required: boolean;
};

// 디자인(image/login2.png) 기준 약관 3종.
// URL은 GET /policies/latest API 응답(useLatestPolicies urlMap)으로 동적 주입.
// 사용자 확정(2026-06-11): location required:true 유지.
export const TERMS: readonly TermsItem[] = [
    {
        key: 'service',
        label: '서비스 이용약관',
        required: true,
    },
    {
        key: 'privacy',
        label: '개인정보 수집 · 이용 동의',
        required: true,
    },
    {
        key: 'location',
        label: '위치기반 서비스 이용약관',
        required: true,
    },
] as const;
