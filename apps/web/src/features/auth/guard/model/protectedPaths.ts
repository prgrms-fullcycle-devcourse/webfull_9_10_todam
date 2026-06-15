// 로그인 필요(보호) 경로 SSOT.
// 클릭 가로채기(useLoginRequiredGuard/BottomNav)·렌더 게이트(RequireAuth 적용 지점) 공유.
// 새 보호 라우트는 여기만 추가.

// prefix 매칭: 경로 자신 또는 그 하위 전부 보호.
const PROTECTED_PREFIXES = ['/my', '/notifications'] as const;

// 정규식 매칭: 공개 세그먼트 안의 일부만 보호인 경우(예: /classes/:id 는 공개, /reserve 만 보호).
const PROTECTED_PATTERNS: RegExp[] = [/^\/classes\/[^/]+\/reserve(\/|$)/];

export function isProtectedPath(pathname: string): boolean {
    return (
        PROTECTED_PREFIXES.some(
            (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
        ) || PROTECTED_PATTERNS.some((re) => re.test(pathname))
    );
}
