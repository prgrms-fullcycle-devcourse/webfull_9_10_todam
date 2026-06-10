// QR 페이로드 = 작품 상세 URL. 스캔 시 모바일 브라우저/PWA가 이 URL을 연다.
// origin 은 호출부에서 주입(NEXT_PUBLIC_APP_URL ?? window.location.origin) → 본 함수는 순수.
// contract/decision: docs/exec-plans/active/partner-qr-pdf.md (결정 1)
export function buildArtworkDetailUrl(origin: string, artworkId: string): string {
    const base = origin.replace(/\/+$/, '');
    return `${base}/partner/artworks/${artworkId}`;
}
