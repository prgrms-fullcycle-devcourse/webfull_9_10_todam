'use client';

import { RightIcon } from '@todam/ui';
import { useRouter } from 'next/navigation';

import { useReviewStore } from '@/entities/store';

// 파트너 설정. 현재 공방관리(현재 공방 상세 진입)만. 나머지 항목은 후속.
export default function PartnerSettingsPage() {
    const router = useRouter();
    const { setReviewStoreId } = useReviewStore();

    // 공방관리 = 현재 작업 공방(currentStore) 상세. review 보기 상태 해제 후 진입.
    const goStore = () => {
        setReviewStoreId(null);
        router.push('/partner/store');
    };

    return (
        <main className="flex-1 overflow-y-auto px-4 py-2">
            <button
                type="button"
                onClick={goStore}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface p-4 text-left transition-colors hover:bg-muted"
            >
                <span className="text-base font-medium text-foreground">공방 관리</span>
                <RightIcon size={24} className="shrink-0 text-foreground-tertiary" />
            </button>
        </main>
    );
}
