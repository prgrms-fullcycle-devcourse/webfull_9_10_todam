'use client';

import Image from 'next/image';

import { LikeToggleButton } from '../../../../features/toggle-like';

type LikedStore = { id: string; name: string; address: string; imageSrc?: string };

const MOCK: LikedStore[] = [
    { id: '1', name: '흙담', address: '서울특별시 성동구 뚝섬로 273' },
    { id: '2', name: '토담 공방', address: '서울특별시 종로구 도담길 12' },
];

export default function FavoritesPage() {
    return (
        <main className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
            {MOCK.map((store) => (
                <div key={store.id} className="flex w-full items-center gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {store.imageSrc && (
                            <Image
                                src={store.imageSrc}
                                alt={store.name}
                                fill
                                sizes="80px"
                                className="object-cover"
                            />
                        )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <p className="truncate text-base font-semibold leading-5 text-foreground">
                            {store.name}
                        </p>
                        <p className="truncate text-xs text-foreground-tertiary">{store.address}</p>
                    </div>
                    <LikeToggleButton storeId={store.id} initialLiked />
                </div>
            ))}
        </main>
    );
}
