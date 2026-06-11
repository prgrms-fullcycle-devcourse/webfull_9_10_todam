import { Button } from '@todam/ui';

// 디자인 시스템 Button 기반 숫자 페이저(목록 화면 전용).
// 기존 Pagination(dot형)은 대량 페이지에 부적합 → Button(sm)으로 숫자형 구성.

export type TablePaginationProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
};

// 현재 페이지 주변 ±2 윈도우. 끝과 멀면 줄임표(…).
function buildPageWindow(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
    const pages = new Set<number>([1, totalPages]);
    for (let p = currentPage - 2; p <= currentPage + 2; p += 1) {
        if (p >= 1 && p <= totalPages) pages.add(p);
    }
    const sorted = [...pages].sort((a, b) => a - b);

    const result: (number | 'ellipsis')[] = [];
    let prev = 0;
    for (const p of sorted) {
        if (prev && p - prev > 1) result.push('ellipsis');
        result.push(p);
        prev = p;
    }
    return result;
}

export function TablePagination({ currentPage, totalPages, onPageChange }: TablePaginationProps) {
    if (totalPages <= 1) return null;

    const items = buildPageWindow(currentPage, totalPages);

    return (
        <nav className="flex items-center justify-center gap-1" aria-label="페이지네이션">
            <Button
                variant="ghost"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                aria-label="이전 페이지"
            >
                이전
            </Button>

            {items.map((item, idx) =>
                item === 'ellipsis' ? (
                    <span
                        key={`ellipsis-${idx}`}
                        className="inline-flex h-10 min-w-10 items-center justify-center text-sm text-foreground-tertiary"
                    >
                        …
                    </span>
                ) : (
                    <Button
                        key={item}
                        variant={item === currentPage ? 'filled' : 'ghost'}
                        size="sm"
                        className="min-w-10 !px-3"
                        aria-current={item === currentPage}
                        onClick={() => onPageChange(item)}
                    >
                        {item}
                    </Button>
                ),
            )}

            <Button
                variant="ghost"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                aria-label="다음 페이지"
            >
                다음
            </Button>
        </nav>
    );
}
