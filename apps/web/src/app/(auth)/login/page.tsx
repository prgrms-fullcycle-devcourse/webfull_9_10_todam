'use client';

import { LoginForm } from '@/features/auth/login';
import { ResetRequestSheet } from '@/features/auth/reset-password';
import { consumeOnboardingPending, OnboardingSheet } from '@/features/onboarding';
import { useSheet } from '@/shared/model';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const { open } = useSheet();

    return (
        <LoginForm
            onForgotPassword={() => open(<ResetRequestSheet />)}
            onLoginSuccess={() => {
                if (consumeOnboardingPending()) {
                    open(<OnboardingSheet onSelectRegister={() => router.push('/apply')} />);
                }
            }}
        />
    );
}
