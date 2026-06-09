// Kakao Maps JS SDK 기반 주소 → 좌표 변환.

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
const SDK_SRC = (key: string) =>
    `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`;

export interface GeocodeCoords {
    latitude: number;
    longitude: number;
}

interface KakaoGeocoderResult {
    x: string; // longitude
    y: string; // latitude
}
// coord2RegionCode 응답 항목 (행정구역). region_type: 'H'=행정동, 'B'=법정동.
interface KakaoRegionResult {
    region_type: string;
    region_1depth_name: string; // 시/도
    region_2depth_name: string; // 시/군/구
    region_3depth_name: string; // 읍/면/동
}
interface KakaoGeocoder {
    addressSearch: (
        addr: string,
        cb: (result: KakaoGeocoderResult[], status: string) => void,
    ) => void;
    coord2RegionCode: (
        lng: number,
        lat: number,
        cb: (result: KakaoRegionResult[], status: string) => void,
    ) => void;
}
// ── 지도 렌더용 최소 타입 ─────────────────────────────────────────
export interface KakaoLatLng {
    getLat: () => number;
    getLng: () => number;
}
export interface KakaoMap {
    setDraggable: (v: boolean) => void;
    setZoomable: (v: boolean) => void;
    relayout: () => void;
    setCenter: (latlng: KakaoLatLng) => void;
}
export interface KakaoMarker {
    setMap: (map: KakaoMap | null) => void;
}

interface KakaoMapsNamespace {
    load: (cb: () => void) => void;
    services: {
        Geocoder: new () => KakaoGeocoder;
        Status: { OK: string };
    };
    LatLng: new (lat: number, lng: number) => KakaoLatLng;
    Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
    Marker: new (options: { position: KakaoLatLng; map?: KakaoMap }) => KakaoMarker;
}

declare global {
    interface Window {
        kakao?: { maps?: KakaoMapsNamespace };
    }
}

let loading: Promise<void> | null = null;

export function loadKakaoMaps(): Promise<void> {
    return loadSdk();
}

function loadSdk(): Promise<void> {
    if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
    if (!KAKAO_APP_KEY) return Promise.reject(new Error('Kakao Map 키 미설정'));
    if (window.kakao?.maps?.services) return Promise.resolve();
    if (loading) return loading;

    loading = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-sdk]');
        const onReady = () => {
            const maps = window.kakao?.maps;
            if (!maps) {
                loading = null;
                reject(new Error('Kakao Maps SDK 로드 실패'));
                return;
            }
            // autoload=false → load() 로 services 모듈 준비 후 resolve.
            maps.load(() => resolve());
        };

        if (existing) {
            existing.addEventListener('load', onReady, { once: true });
            existing.addEventListener(
                'error',
                () => {
                    loading = null;
                    reject(new Error('Kakao Maps SDK 로드 실패'));
                },
                { once: true },
            );
            return;
        }

        const script = document.createElement('script');
        script.src = SDK_SRC(KAKAO_APP_KEY);
        script.async = true;
        script.dataset.kakaoSdk = 'true';
        script.onload = onReady;
        script.onerror = () => {
            loading = null;
            reject(new Error('Kakao Maps SDK 로드 실패'));
        };
        document.head.appendChild(script);
    });
    return loading;
}

export interface RegionLabel {
    sido: string;
    sigungu: string;
    dong: string;
}

// 좌표 → 행정구역(시/구/동). 근처 공방 헤더의 현재 위치 라벨용.
// 변환 실패/결과 없음 시 throw (호출측에서 폴백 처리).
export async function reverseGeocodeRegion(coords: GeocodeCoords): Promise<RegionLabel> {
    await loadSdk();
    const maps = window.kakao!.maps!;
    return new Promise<RegionLabel>((resolve, reject) => {
        const geocoder = new maps.services.Geocoder();
        geocoder.coord2RegionCode(coords.longitude, coords.latitude, (result, status) => {
            // 행정동('H') 우선, 없으면 첫 항목
            const region = result.find((r) => r.region_type === 'H') ?? result[0];
            if (status === maps.services.Status.OK && region) {
                resolve({
                    sido: region.region_1depth_name,
                    sigungu: region.region_2depth_name,
                    dong: region.region_3depth_name,
                });
                return;
            }
            reject(new Error('좌표 행정구역 변환 실패'));
        });
    });
}

// 주소 문자열 → 좌표. 변환 실패/결과 없음 시 throw (호출측에서 토스트 처리).
export async function geocodeAddress(address: string): Promise<GeocodeCoords> {
    await loadSdk();
    const maps = window.kakao!.maps!;
    return new Promise<GeocodeCoords>((resolve, reject) => {
        const geocoder = new maps.services.Geocoder();
        geocoder.addressSearch(address, (result, status) => {
            if (status === maps.services.Status.OK && result[0]) {
                resolve({
                    latitude: Number(result[0].y),
                    longitude: Number(result[0].x),
                });
                return;
            }
            reject(new Error('주소 좌표 변환 실패'));
        });
    });
}
