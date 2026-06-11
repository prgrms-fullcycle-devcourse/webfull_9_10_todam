// MSW mock 보조 — 실 BE 미구현 핸들러(geocode, 알림설정)에서만 사용.
// 실 BE 보유 기능 mock 제거(#306)로 seed/helper 전체가 dead가 되어 제거됨.

export function nowIso(): string {
    return new Date().toISOString();
}

// 주소 → 좌표 mock. (실연동: 카카오 로컬 API) 서울 도심 기준 deterministic offset.
export function mockGeocode(query: string): { latitude: number; longitude: number } {
    let hash = 0;
    for (let i = 0; i < query.length; i += 1) {
        hash = (hash * 31 + query.charCodeAt(i)) % 100000;
    }
    const latitude = 37.5 + (hash % 1000) / 100000; // 37.5 ~ 37.51
    const longitude = 127.0 + ((hash >> 3) % 1000) / 100000;
    return { latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)) };
}
