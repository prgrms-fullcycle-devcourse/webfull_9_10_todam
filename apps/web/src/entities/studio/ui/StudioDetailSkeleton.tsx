// 공방 상세 로딩 스켈레톤. user/partner 공용.
export function StudioDetailSkeleton() {
    return (
        <div className="min-h-full bg-background">
            <div className="aspect-[3/2] w-full animate-pulse bg-muted" />
            <div className="flex flex-col gap-6 px-4 pt-5">
                <div className="flex flex-col gap-3">
                    <div className="h-8 w-40 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-px bg-border" />
                <div className="flex flex-col gap-3">
                    <div className="h-5 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-20 animate-pulse rounded-2xl bg-muted" />
                    <div className="h-20 animate-pulse rounded-2xl bg-muted" />
                </div>
            </div>
        </div>
    );
}
