// OAuth 인가코드 획득 URL 빌더.
// 카카오·구글 OAuth 2.0 인가코드 플로우: 인가 URL로 리다이렉트 → 콜백 라우트에서 code 수신.
//
// 환경 변수(NEXT_PUBLIC_*):
//   NEXT_PUBLIC_KAKAO_CLIENT_ID   — 카카오 REST API 키
//   NEXT_PUBLIC_GOOGLE_CLIENT_ID  — 구글 OAuth 2.0 클라이언트 ID
//   NEXT_PUBLIC_APP_URL           — 배포 도메인(리다이렉트 URI 기준)
//
// redirect_uri: {APP_URL}/oauth/kakao | /oauth/google
// 카카오/구글 콘솔에서 동일한 URI를 허용 목록에 등록해야 함.

function appUrl(): string {
    // 브라우저 실행 환경에서만 호출됨.
    return process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
}

export function buildKakaoAuthUrl(): string {
    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? '';
    const redirectUri = `${appUrl()}/oauth/kakao`;
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        // 이메일 동의항목만 명시적으로 요청. 닉네임은 미수집(가입 시 랜덤 생성).
        scope: 'account_email',
    });
    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

export function buildGoogleAuthUrl(): string {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
    const redirectUri = `${appUrl()}/oauth/google`;
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'openid email profile',
        access_type: 'online',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
