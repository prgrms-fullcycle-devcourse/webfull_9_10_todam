// 예약자 정보 로컬 저장 — 예약 생성 프리필(ReserveClient)과
// 개인 정보 수정 화면(ProfileEditScreen)이 같은 키를 공유한다.
const LS_KEY = 'todam_reserver_info';

export interface SavedReserverInfo {
    name: string;
    phone: string;
}

export function loadSavedReserverInfo(): SavedReserverInfo | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(LS_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as SavedReserverInfo;
    } catch {
        return null;
    }
}

export function saveReserverInfo(info: SavedReserverInfo) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LS_KEY, JSON.stringify(info));
}
