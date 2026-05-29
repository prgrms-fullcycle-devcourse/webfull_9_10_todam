'use client';

import { useRouter } from 'next/navigation';

import { MenuTable } from '../../../shared/ui';

export default function MyPage() {
    const router = useRouter();

    return (
        <main className="flex-1 overflow-y-auto px-4 py-6">
            <MenuTable
                rows={[
                    { label: '파트너 신청하기', onClick: () => router.push('/apply') },
                    { label: '프로필 설정', onClick: () => router.push('/my/profile') },
                    { label: '예약 내역', onClick: () => router.push('/my/reservations') },
                    { label: '찜한 공방', onClick: () => router.push('/my/favorites') },
                ]}
            />
        </main>
    );
}
