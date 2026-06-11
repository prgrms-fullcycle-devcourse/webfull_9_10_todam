// 인증 토큰 주입 지점. auth 모듈이 setAuthTokenGetter 로 연결.
// 미연결 시 null → 헤더 미부착.
type TokenGetter = () => string | null;

let tokenGetter: TokenGetter = () =>
    typeof window === 'undefined' ? null : window.localStorage.getItem('admin_accessToken');

export function setAuthTokenGetter(getter: TokenGetter): void {
    tokenGetter = getter;
}

export function getAuthToken(): string | null {
    return tokenGetter();
}
