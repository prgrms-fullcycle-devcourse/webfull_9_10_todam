'use client';

import { StoreStatus } from '@todam/shared';
import { useRouter } from 'next/navigation';

import { useCurrentStudio, useReviewStore } from '@/entities/studio';
import { useCurrentStudioQuery, useUpdateCurrentStudioMutation } from '@/entities/studio';
import { usePartnerStudioDetail } from '@/entities/studio';
import { useSheet, useToast } from '@/shared/model';
import { useCurrentStudioId } from '@/entities/studio';

import { ChangeStudioCard } from './ChangeStudioCard';
import { StudioSwitchSheet, type StudioSwitchSheetStore } from './StudioSwitchSheet';

// 파트너홈 공방 전환 영역
export function CurrentStudioSection() {
    const router = useRouter();
    const { open, close } = useSheet();
    const { push } = useToast();
    const { setStudioId } = useCurrentStudio();
    const { setReviewStoreId } = useReviewStore();
    const { mutate: updateCurrentStudio } = useUpdateCurrentStudioMutation();
    const storeId = useCurrentStudioId();
    const { data: detail } = usePartnerStudioDetail(storeId);
    const { data: current } = useCurrentStudioQuery(Boolean(storeId));

    // storeId 미확정/상세 로딩 중엔 렌더 보류(AppShell bootstrap이 storeId 보장).
    if (!storeId || !detail) return null;

    const stores = current?.stores ?? [];

    const handleSelect = (store: StudioSwitchSheetStore) => {
        close();

        // 게시중만 실제 전환. 그 외 상태는 currentStore 미변경
        if (store.status !== StoreStatus.PUBLISHED) {
            setReviewStoreId(store.id);
            router.push('/partner/studio');
            return;
        }

        setReviewStoreId(null);
        setStudioId(store.id);
        updateCurrentStudio(store.id);
        push({ message: `'${store.name}'(으)로 전환했어요` });
        router.push('/partner');
    };

    const openSwitchSheet = () => {
        open(
            <StudioSwitchSheet
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
            <ChangeStudioCard
                storeName={detail.store.name}
                status={detail.store.status}
                showSwitch={stores.length > 1}
                onSwitch={openSwitchSheet}
            />
        </section>
    );
}
