'use client';

import { useEffect, useRef, useState } from 'react';

import { PinIcon } from '@todam/ui';

import { StoreSearchCard } from '@/features/store/search';

import { DEFAULT_LAT, DEFAULT_LNG } from '@/features/store/search/api';
import { reverseGeocodeRegion } from '@/shared/lib/kakaoGeocode';
import { useNearbyStores } from '../queries';

// 위치 권한 거부/획득 실패 시 기본 지역 라벨 (성수동 폴백 좌표와 일치).
const FALLBACK_REGION_LABEL = '성수동';

// 근처 공방 목록 섹션 (메인 화면).
// 위치 권한 획득 → 성공 시 실제 좌표, 거부/실패 시 성수동 기본 좌표(DEFAULT_LAT/LNG)로 폴백.
// 커서 기반 무한스크롤: IntersectionObserver 로 sentinel 감지 → fetchNextPage.
// plan: docs/exec-plans/active/user-근처-공방-목록-조회.md
export function NearbyStoresSection() {
    // 위치 상태: null = 아직 획득 시도 전/중, { lat, lng } = 확정
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    // 위치 획득 완료 여부 (성공/거부 모두 true)
    const [geoReady, setGeoReady] = useState(false);
    // 헤더 현재 위치 라벨 (동). 폴백/실패 시 성수동 유지 (plan decision #4).
    const [regionLabel, setRegionLabel] = useState(FALLBACK_REGION_LABEL);

    // effect 는 클라이언트에서만 실행되므로 navigator 는 항상 존재.
    // setState 는 비동기 콜백(getCurrentPosition / setTimeout) 안에서만 호출 →
    // effect 내 동기 setState 회피 (react-hooks/set-state-in-effect 룰 정합).
    useEffect(() => {
        let cancelled = false;
        // 권한 거부 / 획득 실패 / 미지원 → 성수동 폴백 (plan decision #4)
        const applyFallback = () => {
            if (cancelled) return;
            setCoords({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
            setGeoReady(true);
        };

        if (!navigator.geolocation) {
            const timer = setTimeout(applyFallback, 0);
            return () => {
                cancelled = true;
                clearTimeout(timer);
            };
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if (cancelled) return;
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGeoReady(true);
            },
            applyFallback,
            { timeout: 5000 },
        );
        return () => {
            cancelled = true;
        };
    }, []);

    // 확정된 좌표 → 현재 위치 동 라벨 (카카오 reverse-geocode 1회). 실패 시 폴백 유지.
    useEffect(() => {
        if (!coords) return;
        let cancelled = false;
        reverseGeocodeRegion({ latitude: coords.lat, longitude: coords.lng })
            .then((region) => {
                if (!cancelled && region.dong) setRegionLabel(region.dong);
            })
            .catch(() => {
                // 카카오 키 미설정/실패 → 폴백 라벨 유지
            });
        return () => {
            cancelled = true;
        };
    }, [coords]);

    const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useNearbyStores({
            lat: coords?.lat,
            lng: coords?.lng,
            // geoReady 전에는 enabled=false → 위치 확정 후 자동 실행 (plan decision #4)
            enabled: geoReady,
        });

    // 무한 스크롤 sentinel
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !hasNextPage || isFetchingNextPage) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) void fetchNextPage();
            },
            { rootMargin: '120px 0px 0px 0px' },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const stores = data?.pages.flatMap((p) => p.stores) ?? [];
    const isEmpty = geoReady && !isLoading && !isError && stores.length === 0;

    return (
        <section className="flex flex-col gap-3 py-2">
            {/* 헤더: 제목 + 현재 위치 동 라벨 (디자인 SectionTitle size=md) */}
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-foreground">근처 공방</h2>
                <span className="flex shrink-0 items-center gap-1 text-xs text-foreground-tertiary">
                    <PinIcon size={16} className="text-foreground-tertiary" />
                    {regionLabel}
                </span>
            </div>

            {/* 위치 로딩 중 또는 쿼리 로딩 중 */}
            {(!geoReady || isLoading) && (
                <p className="py-6 text-center text-sm text-foreground-tertiary">
                    주변 공방을 불러오는 중입니다.
                </p>
            )}

            {/* 에러 */}
            {isError && geoReady && !isLoading && (
                <p className="py-6 text-center text-sm text-foreground-tertiary">
                    주변 공방을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                </p>
            )}

            {/* 빈 상태 */}
            {isEmpty && (
                <p className="py-6 text-center text-sm text-foreground-tertiary">
                    주변에 등록된 공방이 없습니다.
                </p>
            )}

            {/* 공방 목록 */}
            {stores.length > 0 && (
                <ul className="flex flex-col gap-6">
                    {stores.map((store) => (
                        <li key={store.id}>
                            {/* 근처 카드: region은 dong만 표기 (plan contract) */}
                            <StoreSearchCard store={store} regionFormat="dong" />
                        </li>
                    ))}
                </ul>
            )}

            {/* 무한 스크롤 sentinel */}
            <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
            {isFetchingNextPage && (
                <p className="py-3 text-center text-xs text-foreground-tertiary">
                    불러오는 중입니다.
                </p>
            )}
        </section>
    );
}
