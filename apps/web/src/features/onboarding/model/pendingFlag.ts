// 회원가입 직후 첫 로그인에 온보딩 1회 노출용 플래그(localStorage).
// 서버 저장 안 함(결정 2026-06-05). signup 성공 시 mark, login 성공 시 consume(읽고 제거)→노출.
const KEY = 'onboarding:pending';

export function markOnboardingPending(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(KEY, '1');
}

// 플래그 존재 여부 반환 + 즉시 제거(1회성).
export function consumeOnboardingPending(): boolean {
    if (typeof window === 'undefined') return false;
    const pending = window.localStorage.getItem(KEY) === '1';
    if (pending) window.localStorage.removeItem(KEY);
    return pending;
}
