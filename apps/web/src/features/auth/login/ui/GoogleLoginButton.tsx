'use client';

import { GoogleIcon } from '@todam/ui';

export type GoogleLoginButtonProps = {
    onClick?: () => void;
    disabled?: boolean;
};

// 구글 소셜 로그인 시작 버튼 (유스케이스). OAuth 인가코드 획득 → POST /auth/oauth/google 연동은 다음 단계.
export function GoogleLoginButton({ onClick, disabled }: GoogleLoginButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-border-subtle bg-surface text-base font-semibold text-foreground transition-colors hover:border-primary disabled:opacity-50"
        >
            <GoogleIcon size={20} />
            Google로 시작하기
        </button>
    );
}
