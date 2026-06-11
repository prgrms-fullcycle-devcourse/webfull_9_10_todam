import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { router } from './app/router';
import {
    connectAdminAuthTokenGetter,
    useAdminAuthStore,
} from './features/auth/model/adminAuthStore';
import { ApiError, setApiErrorHandler } from './shared/api';

import './index.css';

// auth-token getter를 스토어와 연결 → adminApiFetch가 Bearer 자동 주입.
connectAdminAuthTokenGetter();

// 401 만료 시 인증 해제 → RequireAuth가 /login으로 리다이렉트.
setApiErrorHandler((error: ApiError) => {
    if (error.statusCode === 401) {
        useAdminAuthStore.getState().clearAuth();
    }
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, refetchOnWindowFocus: false },
    },
});

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root 엘리먼트를 찾을 수 없습니다.');

createRoot(rootEl).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    </StrictMode>,
);
