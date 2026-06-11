import { useQuery } from '@tanstack/react-query';
import { StoreStatus } from '@todam/shared';
import { StatusFilterChip, TextInput } from '@todam/ui';
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { getAdminStoreList } from '@/features/store-review/api';
import { STORE_STATUS_FILTERS, STORE_STATUS_LABEL } from '@/features/store-review/model/labels';
import { StoreReviewTable } from '@/features/store-review/ui/StoreReviewTable';
import { TablePagination } from '@/features/store-review/ui/TablePagination';

const LIMIT = 10;

function parseStatus(raw: string | null): StoreStatus {
    if (raw && STORE_STATUS_FILTERS.includes(raw as StoreStatus)) return raw as StoreStatus;
    return StoreStatus.PENDING;
}

export function StoreReviewListPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const status = parseStatus(searchParams.get('status'));
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const q = searchParams.get('q') ?? '';

    const [searchInput, setSearchInput] = useState(q);

    const query = useQuery({
        queryKey: ['admin', 'stores', { status, page, q }],
        queryFn: () => getAdminStoreList({ status, page, limit: LIMIT, q: q || undefined }),
        placeholderData: (prev) => prev,
    });

    const updateParams = (next: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(next)) {
            if (value === null || value === '') params.delete(key);
            else params.set(key, value);
        }
        setSearchParams(params);
    };

    const handleStatusChange = (nextStatus: StoreStatus) => {
        // 상태 변경 시 페이지 초기화.
        updateParams({ status: nextStatus, page: null });
    };

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        updateParams({ q: searchInput.trim() || null, page: null });
    };

    const stores = query.data?.stores ?? [];
    const pagination = query.data?.pagination;

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-foreground">공방 검수</h1>
                <p className="text-sm text-foreground-secondary">
                    파트너가 등록한 공방을 검토하고 승인·반려를 처리합니다.
                </p>
            </header>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {STORE_STATUS_FILTERS.map((s) => (
                        <StatusFilterChip
                            key={s}
                            selected={s === status}
                            onClick={() => handleStatusChange(s)}
                        >
                            {STORE_STATUS_LABEL[s]}
                        </StatusFilterChip>
                    ))}
                </div>

                <form onSubmit={handleSearchSubmit} className="w-full max-w-xs">
                    <TextInput
                        placeholder="공방명 · 사업자명 검색"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </form>
            </div>

            {query.isError ? (
                <div className="rounded-2xl border border-danger-lighter bg-danger-subtle px-4 py-10 text-center text-sm text-danger-darker">
                    목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                </div>
            ) : query.isLoading ? (
                <div className="rounded-2xl border border-border-subtle bg-surface px-4 py-16 text-center text-sm text-foreground-tertiary">
                    불러오는 중…
                </div>
            ) : stores.length === 0 ? (
                <div className="rounded-2xl border border-border-subtle bg-surface px-4 py-16 text-center text-sm text-foreground-tertiary">
                    {q
                        ? '검색 결과가 없습니다.'
                        : `${STORE_STATUS_LABEL[status]} 상태의 공방이 없습니다.`}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground-secondary">
                            총 {pagination?.totalCount ?? stores.length}건
                        </span>
                    </div>
                    <StoreReviewTable
                        stores={stores}
                        onRowClick={(storeId) => navigate(`/stores/${storeId}`)}
                    />
                    {pagination && (
                        <TablePagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={(p) => updateParams({ page: String(p) })}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
