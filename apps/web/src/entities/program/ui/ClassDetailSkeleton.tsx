// 클래스 상세 로딩 스켈레톤. user/partner 공용.
export function ClassDetailSkeleton() {
    return (
        <div className="flex flex-col gap-6 px-4 pb-16 pt-2">
            <div className="h-44 w-full animate-pulse rounded-2xl bg-muted" />
            <div className="flex flex-col gap-3">
                <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                <div className="h-8 w-44 animate-pulse rounded bg-muted" />
                <div className="h-5 w-28 animate-pulse rounded bg-muted" />
            </div>
            <div className="flex flex-col gap-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-48 w-full animate-pulse rounded-2xl bg-muted" />
        </div>
    );
}
