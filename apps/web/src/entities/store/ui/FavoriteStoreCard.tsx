import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

export type FavoriteStoreCardProps = {
    storeId: string;
    name: string;
    imageUrl: string;
    address: string;
    // 찜 버튼은 features 컴포넌트(FavoriteToggleButton)를 슬롯으로 주입(행동0=표현).
    action?: ReactNode;
};

// 찜 목록 카드(도메인 표현). 썸네일 + 공방명 + 주소 + 찜 버튼 슬롯.
// Design tokens: 카드 가로 gap12, 썸네일 80×80 r12 bg-muted(#F1F2F4),
//   공방명 16 SemiBold foreground(#191E25), 주소 12 Regular foreground-tertiary(#7D838D).
// category: shared PR #255에서 BE 6필드 인터림 확정으로 제거(카테고리 태그 렌더 제거).
// 공방 상세 라우트: 정본 라우트는 slug 기반(/stores/[slug])이나 favorite contract 는 slug 미제공(6필드).
//   → storeId 기반 /stores/{storeId} 로 이동(BE slug 정합 시 교체 필요).
export function FavoriteStoreCard({
    storeId,
    name,
    imageUrl,
    address,
    action,
}: FavoriteStoreCardProps) {
    return (
        <div className="flex w-full items-center gap-3">
            <Link
                href={`/stores/${encodeURIComponent(storeId)}`}
                className="flex min-w-0 flex-1 items-center gap-3"
            >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {imageUrl && (
                        <Image
                            src={imageUrl}
                            alt={name}
                            fill
                            sizes="80px"
                            className="object-cover"
                        />
                    )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <p className="truncate text-base font-semibold leading-5 text-foreground">
                        {name}
                    </p>
                    <p className="truncate text-xs font-normal leading-4 text-foreground-tertiary">
                        {address}
                    </p>
                </div>
            </Link>
            {action}
        </div>
    );
}
