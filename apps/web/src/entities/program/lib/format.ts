// 소요시간(분) → "N시간", "N시간 M분", "M분".
export function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}시간 ${m}분`;
    if (h > 0) return `${h}시간`;
    return `${m}분`;
}

// 가격(원) → "45,000원".
export function formatPrice(price: number): string {
    return `${price.toLocaleString('ko-KR')}원`;
}
