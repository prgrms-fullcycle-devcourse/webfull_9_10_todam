'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArtworkStatusGroup, ArtworkDetailStatus } from '@todam/shared';
import { FilterDropdown, StatusFilterChip, StatusIcon } from '@todam/ui';

import { useSheet } from '@/shared/model';

import { usePartnerArtworks, usePartnerArtworkCount } from '../queries';
import { buildStepFilters, GROUP_LABEL } from '../stepMap';
import { ArtworkCardItem } from './ArtworkCardItem';
import { ArtworkGroupSheet } from './ArtworkGroupSheet';

export type ArtworkListClientProps = {
    storeId: string;
};

export function ArtworkListClient({ storeId }: ArtworkListClientProps) {
    const router = useRouter();
    const { open, close } = useSheet();

    const [group, setGroup] = useState<ArtworkStatusGroup>(ArtworkStatusGroup.IN_PROGRESS);
    const [selectedDetailStatus, setSelectedDetailStatus] = useState<
        ArtworkDetailStatus | undefined
    >(undefined);

    const { data: countData } = usePartnerArtworkCount({ storeId, group });

    const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
        usePartnerArtworks({ storeId, group, detailStatus: selectedDetailStatus });

    // 무한 스크롤 sentinel
    const sentinelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    void fetchNextPage();
                }
            },
            { threshold: 0.1 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const artworks = data?.pages.flatMap((p) => p.artworks) ?? [];

    const stepFilters = buildStepFilters(group, countData?.steps ?? {});

    const handleGroupSelect = useCallback((nextGroup: ArtworkStatusGroup) => {
        setGroup(nextGroup);
        setSelectedDetailStatus(undefined);
    }, []);

    const handleOpenGroupSheet = useCallback(() => {
        open(
            <ArtworkGroupSheet
                selectedGroup={group}
                onSelect={handleGroupSelect}
                onClose={close}
            />,
        );
    }, [open, close, group, handleGroupSelect]);

    const handleChipClick = (detailStatus: ArtworkDetailStatus | undefined) => {
        setSelectedDetailStatus((prev) => (prev === detailStatus ? undefined : detailStatus));
    };

    return (
        <main className="flex flex-1 flex-col overflow-y-auto">
            <div className="overflow-x-auto py-3">
                <div className="flex w-max items-center gap-2 pr-4">
                    <FilterDropdown icon={<StatusIcon />} onClick={handleOpenGroupSheet}>
                        {GROUP_LABEL[group] ?? group}
                    </FilterDropdown>

                    {stepFilters.map((f) => (
                        <StatusFilterChip
                            key={f.key}
                            selected={
                                f.detailStatus !== undefined &&
                                selectedDetailStatus === f.detailStatus
                            }
                            count={f.count}
                            onClick={() => handleChipClick(f.detailStatus)}
                        >
                            {f.label}
                        </StatusFilterChip>
                    ))}
                </div>
            </div>

            {/* 목록 */}
            <div className="flex-1 px-4 pb-16">
                {isLoading && (
                    <p className="py-10 text-center text-sm text-foreground-tertiary">
                        작품 목록을 불러오는 중입니다.
                    </p>
                )}

                {isError && (
                    <p className="py-10 text-center text-sm text-foreground-tertiary">
                        작품 목록을 불러오지 못했습니다.
                        <br />
                        잠시 후 다시 시도해주세요.
                    </p>
                )}

                {!isLoading && !isError && artworks.length === 0 && (
                    <div className="flex h-64 items-center justify-center">
                        <p className="text-sm text-foreground-tertiary">
                            해당 단계의 작품이 없습니다.
                        </p>
                    </div>
                )}

                {!isLoading && !isError && artworks.length > 0 && (
                    <section className="flex flex-col gap-3 py-2">
                        {artworks.map((item) => (
                            <ArtworkCardItem
                                key={item.id}
                                item={item}
                                onClick={() => router.push(`/partner/artworks/${item.id}`)}
                            />
                        ))}
                    </section>
                )}

                {/* 무한 스크롤 sentinel */}
                <div ref={sentinelRef} className="h-1" />

                {isFetchingNextPage && (
                    <p className="py-4 text-center text-sm text-foreground-tertiary">
                        불러오는 중...
                    </p>
                )}
            </div>
        </main>
    );
}
