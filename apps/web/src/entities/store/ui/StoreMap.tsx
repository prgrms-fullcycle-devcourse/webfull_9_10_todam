'use client';

import { useEffect, useRef, useState } from 'react';

import { loadKakaoMaps } from '@/shared/lib/kakaoGeocode';
import { useToast } from '@/shared/model';

export type StoreMapProps = {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
};

// 공방 위치 지도. Kakao Maps 로 마커 렌더(드래그·줌 비활성 → 영역 전체가 버튼).
// 클릭 시 카카오맵 링크로 이동: 앱 설치 시 앱, 없으면 웹으로 열림.
// SDK 로드 실패(키 미설정·도메인 미등록 등) 시 placeholder 폴백 → 클릭하면 주소 복사 + 토스트.
export function StoreMap({ latitude, longitude, name, address }: StoreMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [failed, setFailed] = useState(false);
    const { push } = useToast();

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                await loadKakaoMaps();
                if (cancelled || !containerRef.current) return;
                const maps = window.kakao!.maps!;
                const center = new maps.LatLng(latitude, longitude);
                const map = new maps.Map(containerRef.current, { center, level: 4 });
                map.setDraggable(false);
                map.setZoomable(false);
                const marker = new maps.Marker({ position: center });
                marker.setMap(map);
                // 컨테이너 크기 확정 후 재배치 — 마커·중심 어긋남 방지.
                map.relayout();
                map.setCenter(center);
            } catch {
                if (!cancelled) setFailed(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [latitude, longitude]);

    function openExternal() {
        const url = `https://map.kakao.com/link/map/${encodeURIComponent(name)},${latitude},${longitude}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    async function copyAddress() {
        try {
            await navigator.clipboard.writeText(address);
            push({ message: '주소를 복사했어요.' });
        } catch {
            push({ message: '주소 복사에 실패했어요.' });
        }
    }

    return (
        <button
            type="button"
            onClick={failed ? copyAddress : openExternal}
            aria-label={failed ? `${name} 주소 복사` : `${name} 위치 지도에서 보기`}
            className="relative z-0 block h-32 w-full cursor-pointer overflow-hidden rounded-2xl bg-muted"
        >
            {failed ? (
                <span className="grid h-full w-full place-items-center text-xs font-medium text-foreground-tertiary">
                    지도 보기
                </span>
            ) : (
                <>
                    <div ref={containerRef} className="h-full w-full" />
                    {/* 지도 캔버스 위 클릭 가로채기 — 내부 map 이벤트 대신 외부 앱 열기 보장 + 포인터 커서 */}
                    <span className="absolute inset-0 cursor-pointer" aria-hidden />
                </>
            )}
        </button>
    );
}
