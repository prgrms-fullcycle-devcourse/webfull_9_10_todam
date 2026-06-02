'use client';

import { KakaoIcon } from '@todam/ui';

// 카카오 버튼 배경은 카카오 브랜드 가이드라인의 고정 색상(디자인 토큰 범위 밖).
const KAKAO_BRAND_BG = '#FEE500';

export type KakaoLoginButtonProps = {
    onClick?: () => void;
    disabled?: boolean;
};

// 카카오 소셜 로그인 시작 버튼 (유스케이스). OAuth 인가코드 획득 → POST /auth/oauth/kakao 연동은 다음 단계.
export function KakaoLoginButton({ onClick, disabled }: KakaoLoginButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            style={{ backgroundColor: KAKAO_BRAND_BG }}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold text-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
            <KakaoIcon size={20} />
            카카오로 시작하기
        </button>
    );
}
