// 입력값을 숫자만 남기고 한국 전화번호/사업자등록번호 규칙에 맞춰 하이픈을 자동 삽입한다.
// 검증 스키마(phoneSchema, businessNumberSchema)가 기대하는 포맷과 일치한다.

// 전화번호 자동 하이픈 포맷.
// - 02(서울): 02-XXX-XXXX 또는 02-XXXX-XXXX
// - 그 외(010, 0XX): 0XX-XXX-XXXX 또는 0XX-XXXX-XXXX
export function formatPhone(value: string): string {
    const d = value.replace(/\D/g, '').slice(0, 11);

    if (d.startsWith('02')) {
        if (d.length < 3) return d;
        if (d.length < 6) return `${d.slice(0, 2)}-${d.slice(2)}`;
        if (d.length < 10) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
        return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
    }

    if (d.length < 4) return d;
    if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
    if (d.length < 11) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

// 사업자등록번호 자동 하이픈 포맷. 항상 3-2-5 (10자리).
export function formatBusinessNumber(value: string): string {
    const d = value.replace(/\D/g, '').slice(0, 10);

    if (d.length < 4) return d;
    if (d.length < 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5, 10)}`;
}

// 가격(원) → "45,000원".
export function formatPrice(price: number): string {
    return `${price.toLocaleString('ko-KR')}원`;
}

// 소요시간(분) → "N시간", "N시간 M분", "M분".
export function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}시간 ${m}분`;
    if (h > 0) return `${h}시간`;
    return `${m}분`;
}

// 초 → "MM:SS" (카운트다운 타이머 등). 음수는 0으로 처리.
export function formatMmSs(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
