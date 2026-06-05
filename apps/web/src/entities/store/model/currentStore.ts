import { create } from 'zustand';

type CurrentStoreState = {
    storeId: string | null;
    setStoreId: (id: string | null) => void;
    // 심사중·반려 공방 심사결과 출력 / currentStore를 오염하지 않기 위한 장치
    reviewStoreId: string | null;
    setReviewStoreId: (id: string | null) => void;
};

export const useCurrentStoreStore = create<CurrentStoreState>((set) => ({
    storeId: null,
    setStoreId: (id) => set({ storeId: id }),
    reviewStoreId: null,
    setReviewStoreId: (id) => set({ reviewStoreId: id }),
}));

export function useCurrentStore() {
    const storeId = useCurrentStoreStore((s) => s.storeId);
    const setStoreId = useCurrentStoreStore((s) => s.setStoreId);
    return { storeId, setStoreId };
}

export function useReviewStore() {
    const reviewStoreId = useCurrentStoreStore((s) => s.reviewStoreId);
    const setReviewStoreId = useCurrentStoreStore((s) => s.setReviewStoreId);
    return { reviewStoreId, setReviewStoreId };
}
