// Daum(카카오) 우편번호 서비스 로더. key 불필요, 프론트 직접 연동.
// 좌표(lat/lng)는 제공 안 함 → 별도 geocode API 호출 필요.

const SCRIPT_SRC = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

export interface PostcodeResult {
    roadAddress: string;
    jibunAddress: string;
    zonecode: string;
}

interface DaumPostcode {
    open: () => void;
}
interface DaumNamespace {
    Postcode: new (opts: {
        oncomplete: (data: { roadAddress: string; jibunAddress: string; zonecode: string }) => void;
        // 팝업 닫힘 콜백. state === 'FORCE_CLOSE' = 사용자가 주소 선택 없이 닫음.
        onclose?: (state: 'FORCE_CLOSE' | 'COMPLETE_CLOSE') => void;
    }) => DaumPostcode;
}

declare global {
    interface Window {
        daum?: DaumNamespace;
    }
}

let loading: Promise<void> | null = null;

function loadScript(): Promise<void> {
    if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
    if (window.daum?.Postcode) return Promise.resolve();
    if (loading) return loading;

    loading = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = SCRIPT_SRC;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            loading = null;
            reject(new Error('Daum Postcode 스크립트 로드 실패'));
        };
        document.head.appendChild(script);
    });
    return loading;
}

// 우편번호 팝업 오픈 → 선택 결과 resolve. 미선택 닫기(FORCE_CLOSE) 시 null resolve.
// (oncomplete만 있으면 닫기 시 Promise 가 영원히 pending → 호출측 로딩 플래그가 안 풀려 재오픈 불가 버그)
export async function openPostcode(): Promise<PostcodeResult | null> {
    await loadScript();
    return new Promise<PostcodeResult | null>((resolve, reject) => {
        if (!window.daum?.Postcode) {
            reject(new Error('Daum Postcode 사용 불가'));
            return;
        }
        let completed = false;
        new window.daum.Postcode({
            oncomplete: (data) => {
                completed = true;
                resolve({
                    roadAddress: data.roadAddress,
                    jibunAddress: data.jibunAddress,
                    zonecode: data.zonecode,
                });
            },
            // 선택 없이 닫으면(FORCE_CLOSE) null 로 종료. COMPLETE_CLOSE 는 oncomplete 직후라 무시.
            onclose: (state) => {
                if (!completed && state === 'FORCE_CLOSE') resolve(null);
            },
        }).open();
    });
}
