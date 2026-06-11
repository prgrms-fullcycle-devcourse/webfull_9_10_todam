import { useMutation } from '@tanstack/react-query';
import { Button, TextInput } from '@todam/ui';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiError } from '@/shared/api';

import { adminLogin } from '../api';
import { useAdminAuthStore } from '../model/adminAuthStore';

function resolveErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.statusCode === 401) return '이메일 또는 비밀번호가 올바르지 않습니다.';
        if (error.statusCode === 403) return '어드민 계정이 아닙니다.';
        return error.message || '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.';
    }
    return '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.';
}

export function AdminLoginForm() {
    const navigate = useNavigate();
    const setAuth = useAdminAuthStore((s) => s.setAuth);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const mutation = useMutation({
        mutationFn: adminLogin,
        onSuccess: (data) => {
            setAuth(data.accessToken, data.admin);
            navigate('/', { replace: true });
        },
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!email || !password || mutation.isPending) return;
        mutation.mutate({ email, password });
    };

    return (
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
            <TextInput
                label="이메일"
                type="email"
                autoComplete="username"
                placeholder="admin@todam.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={mutation.isError}
            />
            <TextInput
                label="비밀번호"
                type="password"
                autoComplete="current-password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={mutation.isError}
            />
            {mutation.isError && (
                <p className="text-sm text-danger">{resolveErrorMessage(mutation.error)}</p>
            )}
            <Button type="submit" disabled={!email || !password || mutation.isPending}>
                {mutation.isPending ? '로그인 중…' : '로그인'}
            </Button>
        </form>
    );
}
