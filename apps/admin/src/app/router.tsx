import { createBrowserRouter } from 'react-router-dom';

import { LoginPage } from '@/pages/login/LoginPage';
import { StoreReviewDetailPage } from '@/pages/store-review/StoreReviewDetailPage';
import { StoreReviewListPage } from '@/pages/store-review/StoreReviewListPage';

import { AppLayout } from './AppLayout';
import { RequireAuth } from './RequireAuth';

export const router = createBrowserRouter([
    { path: '/login', element: <LoginPage /> },
    {
        element: <RequireAuth />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    { path: '/', element: <StoreReviewListPage /> },
                    { path: '/stores/:id', element: <StoreReviewDetailPage /> },
                ],
            },
        ],
    },
]);
