// 인증 토큰 주입 지점. auth 모듈이 setAuthTokenGetter 로 연결.
// 미연결 시 null → 헤더 미부착 (mock 단계).
type TokenGetter = () => string | null;

// 기본 getter: 브라우저 localStorage('accessToken') fallback.
// (로그인 연동 전 수동 테스트용 stopgap. auth 모듈 연동 시 setAuthTokenGetter 로 교체.)
let tokenGetter: TokenGetter = () =>
    typeof window === 'undefined' ? null : window.localStorage.getItem('accessToken');

export function setAuthTokenGetter(getter: TokenGetter): void {
    tokenGetter = getter;
}

export function getAuthToken(): string | null {
    return tokenGetter();
}
