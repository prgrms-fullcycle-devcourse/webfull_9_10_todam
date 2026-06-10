import { create } from 'zustand';

type CurrentStudioState = {
    storeId: string | null;
    setStudioId: (id: string | null) => void;
    // 심사중·반려 공방 심사결과 출력 / currentStore를 오염하지 않기 위한 장치
    reviewStoreId: string | null;
    setReviewStoreId: (id: string | null) => void;
};

export const useCurrentStudioStore = create<CurrentStudioState>((set) => ({
    storeId: null,
    setStudioId: (id) => set({ storeId: id }),
    reviewStoreId: null,
    setReviewStoreId: (id) => set({ reviewStoreId: id }),
}));

export function useCurrentStudio() {
    const storeId = useCurrentStudioStore((s) => s.storeId);
    const setStudioId = useCurrentStudioStore((s) => s.setStudioId);
    return { storeId, setStudioId };
}

export function useReviewStore() {
    const reviewStoreId = useCurrentStudioStore((s) => s.reviewStoreId);
    const setReviewStoreId = useCurrentStudioStore((s) => s.setReviewStoreId);
    return { reviewStoreId, setReviewStoreId };
}
