// 입력값을 숫자만 남기고 한국 전화번호/사업자등록번호 규칙에 맞춰 하이픈을 자동 삽입한다.
// 검증 스키마(phoneSchema, businessNumberSchema)가 기대하는 포맷과 일치한다.

/**
 * 전화번호 자동 하이픈 포맷.
 * - 02(서울): 02-XXX-XXXX 또는 02-XXXX-XXXX
 * - 그 외(010, 0XX): 0XX-XXX-XXXX 또는 0XX-XXXX-XXXX
 */
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

/**
 * 사업자등록번호 자동 하이픈 포맷. 항상 3-2-5 (10자리).
 */
export function formatBusinessNumber(value: string): string {
    const d = value.replace(/\D/g, '').slice(0, 10);

    if (d.length < 4) return d;
    if (d.length < 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5, 10)}`;
}
