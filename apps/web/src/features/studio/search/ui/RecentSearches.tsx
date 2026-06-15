import { CloseIcon } from '@todam/ui';

type RecentSearchesProps = {
    searches: string[];
    onSelect: (keyword: string) => void;
    onRemove: (keyword: string) => void;
    onClearAll: () => void;
};

// 최근 검색어 목록.
// 빈 상태: "최근 검색어가 없습니다." 노출.
// 개별 × 버튼, 전체삭제 버튼.
export function RecentSearches({ searches, onSelect, onRemove, onClearAll }: RecentSearchesProps) {
    return (
        <section className="flex flex-col px-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between py-3">
                <span className="text-xs font-semibold text-foreground">최근검색어</span>
                {searches.length > 0 && (
                    <button
                        type="button"
                        className="cursor-pointer text-xs text-foreground-tertiary active:text-foreground"
                        onClick={onClearAll}
                    >
                        전체삭제
                    </button>
                )}
            </div>

            {/* 빈 상태 */}
            {searches.length === 0 && (
                <p className="py-6 text-center text-sm text-foreground-tertiary">
                    최근 검색어가 없습니다.
                </p>
            )}

            {/* 검색어 목록 */}
            {searches.length > 0 && (
                <ul className="flex flex-col">
                    {searches.map((keyword) => (
                        <li key={keyword} className="flex items-center gap-3 py-3">
                            <button
                                type="button"
                                className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm text-foreground active:text-foreground-secondary"
                                onClick={() => onSelect(keyword)}
                            >
                                {keyword}
                            </button>
                            <button
                                type="button"
                                className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center text-foreground-tertiary active:text-foreground"
                                aria-label={`'${keyword}' 검색어 삭제`}
                                onClick={() => onRemove(keyword)}
                            >
                                <CloseIcon size={12} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
