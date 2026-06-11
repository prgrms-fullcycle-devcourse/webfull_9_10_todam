import { Button } from '@todam/ui';
import { Outlet, useNavigate } from 'react-router-dom';

import { useAdminAuthStore } from '@/features/auth/model/adminAuthStore';

// 인증 영역 공통 셸. 상단 헤더(브랜드 + 관리자 + 로그아웃) + 본문.
export function AppLayout() {
    const navigate = useNavigate();
    const admin = useAdminAuthStore((s) => s.admin);
    const clearAuth = useAdminAuthStore((s) => s.clearAuth);

    const handleLogout = () => {
        clearAuth();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-dvh bg-background text-foreground">
            <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/90 backdrop-blur">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="!px-2 text-lg !font-bold"
                        onClick={() => navigate('/')}
                    >
                        todam admin
                    </Button>
                    <div className="flex items-center gap-2 text-sm">
                        {admin && <span className="text-foreground-secondary">{admin.name}</span>}
                        <Button variant="ghost" size="sm" onClick={handleLogout}>
                            로그아웃
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-6 py-8">
                <Outlet />
            </main>
        </div>
    );
}
