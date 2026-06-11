import { Outlet } from 'react-router-dom';

// 인증 가드 자리. 로그인/토큰 contract 확정 후 미인증 시 /login 리다이렉트 로직 연결.
export function RequireAuth() {
    return <Outlet />;
}
