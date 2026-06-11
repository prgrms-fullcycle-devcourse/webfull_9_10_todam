// 마지막 등록 FCM 토큰을 로컬에 보관 → 로그아웃 시 revoke 대상 식별용.
const LAST_FCM_TOKEN_KEY = 'todam_fcm_token';

export function getStoredFcmToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(LAST_FCM_TOKEN_KEY);
}

export function setStoredFcmToken(token: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LAST_FCM_TOKEN_KEY, token);
}

export function clearStoredFcmToken(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(LAST_FCM_TOKEN_KEY);
}
