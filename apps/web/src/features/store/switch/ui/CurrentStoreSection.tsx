'use client';

import { StoreStatus } from '@todam/shared';
import { useRouter } from 'next/navigation';

import { useCurrentStore, useReviewStore } from '@/entities/store';
import { useCurrentStoreQuery, useUpdateCurrentStoreMutation } from '@/entities/store';
import { usePartnerStoreDetail } from '@/entities/store';
import { useSheet, useToast } from '@/shared/model';
import { useCurrentStoreId } from '@/entities/store';

import { ChangeStoreCard } from './ChangeStoreCard';
import { StoreSwitchSheet, type StoreSwitchSheetStore } from './StoreSwitchSheet';

// 파트너홈 공방 전환 영역
export function CurrentStoreSection() {
    const router = useRouter();
    const { open, close } = useSheet();
    const { push } = useToast();
    const { setStoreId } = useCurrentStore();
    const { setReviewStoreId } = useReviewStore();
    const { mutate: updateCurrentStore } = useUpdateCurrentStoreMutation();
    const storeId = useCurrentStoreId();
    const { data: detail } = usePartnerStoreDetail(storeId);
    const { data: current } = useCurrentStoreQuery(Boolean(storeId));

    // storeId 미확정/상세 로딩 중엔 렌더 보류(AppShell bootstrap이 storeId 보장).
    if (!storeId || !detail) return null;

    const stores = current?.stores ?? [];

    const handleSelect = (store: StoreSwitchSheetStore) => {
        close();

        // 게시중만 실제 전환. 그 외 상태는 currentStore 미변경
        if (store.status !== StoreStatus.PUBLISHED) {
            setReviewStoreId(store.id);
            router.push('/partner/studio');
            return;
        }

        setReviewStoreId(null);
        setStoreId(store.id);
        updateCurrentStore(store.id);
        push({ message: `'${store.name}'(으)로 전환했어요` });
        router.push('/partner');
    };

    const openSwitchSheet = () => {
        open(
            <StoreSwitchSheet
                stores={stores}
                onSelect={handleSelect}
                onRegister={() => {
                    close();
                    router.push('/partner/studio/new');
                }}
                onClose={close}
            />,
        );
    };

    return (
        <section className="flex flex-col gap-2 py-2">
            <ChangeStoreCard
                storeName={detail.store.name}
                status={detail.store.status}
                showSwitch={stores.length > 1}
                onSwitch={openSwitchSheet}
            />
        </section>
    );
}
