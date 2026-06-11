import { Navigate, Outlet } from 'react-router-dom';

import { useAdminAuthStore } from '@/features/auth/model/adminAuthStore';

// A-0 인증 가드. 미인증 시 로그인으로 리다이렉트.
export function RequireAuth() {
    const isAuthenticated = useAdminAuthStore((s) => s.state === 'AUTHENTICATED');

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return <Outlet />;
}
