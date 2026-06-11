import { Navigate } from 'react-router-dom';

import { AdminLoginForm } from '@/features/auth/ui/AdminLoginForm';
import { useAdminAuthStore } from '@/features/auth/model/adminAuthStore';

export function LoginPage() {
    const isAuthenticated = useAdminAuthStore((s) => s.state === 'AUTHENTICATED');

    // 이미 로그인 상태면 목록으로.
    if (isAuthenticated) return <Navigate to="/" replace />;

    return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-surface px-4 text-foreground">
            <h1 className="text-2xl font-bold">todam admin</h1>
            <AdminLoginForm />
        </main>
    );
}
