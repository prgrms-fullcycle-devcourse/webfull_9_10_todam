'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { StoreManagementItem, StoreStatusBadge } from '../../../entities/store';
import { StoreListHeaderMenu, usePartnerStores } from '../../../features/store/list';
import { useHeaderActionStore } from '../../../shared/model';
import { EmptyState } from '../../../shared/ui';

export default function PartnerStoresPage() {
    const router = useRouter();
    const { data, isLoading, isError } = usePartnerStores();
    const stores = data?.stores ?? [];

    const setAction = useHeaderActionStore((s) => s.setAction);
    const clearAction = useHeaderActionStore((s) => s.clearAction);

    useEffect(() => {
        setAction(<StoreListHeaderMenu />);
        return () => clearAction();
    }, [setAction, clearAction]);

    return (
        <main className="flex-1 overflow-y-auto px-4 pb-16">
            {isLoading && (
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    공방 목록을 불러오는 중입니다.
                </p>
            )}

            {isError && (
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    공방 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                </p>
            )}

            {!isLoading && !isError && stores.length === 0 && (
                <EmptyState message="아직 등록된 공방이 없습니다." />
            )}

            {!isLoading && !isError && stores.length > 0 && (
                <section className="flex flex-col gap-3 py-2">
                    {stores.map((store) => (
                        <StoreManagementItem
                            key={store.id}
                            storeName={store.name}
                            ownerName={store.ownerName}
                            badge={<StoreStatusBadge status={store.status} />}
                            role="button"
                            tabIndex={0}
                            onClick={() => router.push(`/partner/stores/${store.id}`)}
                            className="cursor-pointer text-left"
                        />
                    ))}
                </section>
            )}
        </main>
    );
}
