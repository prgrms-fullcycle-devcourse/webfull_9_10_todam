// 근처 공방 로딩 스켈레톤. StudioSearchCard 레이아웃(80×80 썸네일 + 본문 라인) 대응.
function NearbyStudioCardSkeleton() {
    return (
        <div className="flex w-full animate-pulse items-center gap-3">
            <div className="h-20 w-20 shrink-0 rounded-xl bg-muted" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="h-4 w-1/2 rounded bg-muted" />
                <div className="h-3 w-1/3 rounded bg-muted" />
                <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
        </div>
    );
}

export function NearbyStudiosSkeleton({ count = 4 }: { count?: number }) {
    return (
        <ul className="flex flex-col gap-6" aria-hidden>
            {Array.from({ length: count }).map((_, i) => (
                <li key={i}>
                    <NearbyStudioCardSkeleton />
                </li>
            ))}
        </ul>
    );
}
