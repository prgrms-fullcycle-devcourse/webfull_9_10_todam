import { clientApiFetch } from '@/shared/api';

// POST /auth/logout — 서버 refresh token 세션 삭제 + 쿠키 제거.
// AuthGuard 적용 → clientApiFetch 가 getAuthToken() 의 Bearer accessToken 자동 부착.
// Body 없음. 응답은 2xx 여부만 판별(실 BE 반환 타입 void → body 미보장, plan D-3).
export function logout() {
    return clientApiFetch<void>('/auth/logout', { method: 'POST' });
}
