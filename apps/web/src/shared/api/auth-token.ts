// 인증 토큰 주입 지점. auth 모듈이 setAuthTokenGetter 로 연결.
// 미연결 시 null → 헤더 미부착 (mock 단계).
type TokenGetter = () => string | null;

// 기본 getter: null. 앱 초기화 시 authStore(connectAuthTokenGetter)가 메모리 토큰 getter로 교체.
let tokenGetter: TokenGetter = () => null;

export function setAuthTokenGetter(getter: TokenGetter): void {
    tokenGetter = getter;
}

export function getAuthToken(): string | null {
    return tokenGetter();
}
