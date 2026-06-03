// 클래스 폼 제약 (contract: program-edit / store-programs 기준 단일 출처).
export const TITLE_MIN = 2;
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 1000;

// ─── 필드 단위 검증 (에러 메시지 반환, 통과 시 undefined) ─────────
export function validateTitle(title: string): string | undefined {
    if (title.length < TITLE_MIN) return `클래스명은 ${TITLE_MIN}자 이상 입력해 주세요.`;
    if (title.length > TITLE_MAX) return `클래스명은 ${TITLE_MAX}자 이하로 입력해 주세요.`;
    return undefined;
}

export function validateDescription(description: string): string | undefined {
    if (description.length > DESCRIPTION_MAX)
        return `상세 설명은 ${DESCRIPTION_MAX}자 이하로 입력해 주세요.`;
    return undefined;
}

export function validatePrice(price: number): string | undefined {
    if (!price || price <= 0) return '가격을 입력해 주세요.';
    return undefined;
}

export function validateDurationMinutes(durationMinutes: number): string | undefined {
    if (!durationMinutes) return '소요 시간을 입력해 주세요.';
    return undefined;
}
