/**
 * Google Vision TEXT_DETECTION 결과 텍스트에서 사업자등록증 필드를 추출한다.
 *
 * 파싱 전략:
 * - 사업자번호: 정규식 `/\d{3}-\d{2}-\d{5}/` 직접 매치
 * - 개업일자: "개업/업연월일" 키워드가 있는 줄에서만 날짜를 추출 (생년월일·발급일·노이즈 오인 차단).
 *   "YYYY.MM.DD" / "YYYY년 MM월 DD일" / 8자리 숫자 → "YYYYMMDD" 정규화
 * - 상호명: "상호" 키워드 → 실패 시 갉아먹힌 라벨("호:")을 앵커 정규식으로 추출
 * - 대표자명: "성명"/"대표자" 키워드 → 실패 시 "명:" 앵커 정규식으로 추출
 * - 사업장주소: "사업장소재지" 키워드 → 실패 시 "소재지"를 포함한 줄에서 추출
 *
 * 실제 NTS 사업자등록증은 라벨 첫 글자가 세로로 쌓인 표 레이아웃이라
 * OCR이 라벨을 갉아먹는 경우가 많다(상호→"호:", 성명→"명:", 개업연월일→"매업연월일").
 * 깨끗한 키워드 매칭을 먼저 시도하고, 실패하면 갉아먹힌 형태를 보조 매칭한다.
 *
 * 미추출 필드는 null 반환 (graceful degradation — 파싱 실패는 에러가 아님).
 */
export interface BusinessDocumentParsedFields {
    businessNumber: string | null;
    ownerName: string | null;
    businessName: string | null;
    businessAddress: string | null;
    startDate: string | null;
}

/**
 * 사업자번호: "000-00-00000" 형식
 */
const BUSINESS_NUMBER_RE = /\d{3}-\d{2}-\d{5}/;

const pad2 = (s: string): string => s.padStart(2, '0');

/**
 * 한 줄(또는 텍스트 조각)에서 날짜를 추출해 "YYYYMMDD"로 정규화한다.
 * "YYYY.MM.DD" → "YYYY년 MM월 DD일" → 8자리 숫자 순으로 시도.
 */
function extractDate(text: string): string | null {
    const dot = text.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
    if (dot) return `${dot[1]}${pad2(dot[2]!)}${pad2(dot[3]!)}`;

    const kor = text.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (kor) return `${kor[1]}${pad2(kor[2]!)}${pad2(kor[3]!)}`;

    const compact = text.match(/\b(\d{8})\b/);
    if (compact) return compact[1] ?? null;

    return null;
}

/**
 * 키워드 다음 토큰을 추출한다.
 * OCR 결과는 줄(line)로 나뉘어 있으므로 같은 줄 또는 다음 줄에서 값을 찾는다.
 */
function extractByKeyword(lines: string[], keyword: string): string | null {
    for (let i = 0; i < lines.length; i++) {
        const line = (lines[i] ?? '').trim();
        if (!line.includes(keyword)) continue;

        // 같은 줄에서 키워드 이후 텍스트 추출 (키워드 제거 후 남은 부분)
        const afterKeyword = line
            .slice(line.indexOf(keyword) + keyword.length)
            .replace(/^[\s:：]+/, '')
            .trim();
        if (afterKeyword.length > 0) return afterKeyword;

        // 다음 줄에서 값 추출
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && nextLine.length > 0) return nextLine;
    }
    return null;
}

/**
 * 콜론(":" 또는 "：") 뒤의 값을 추출한다.
 */
function valueAfterColon(line: string): string | null {
    const m = line.match(/[:：]\s*(.+)$/);
    return m ? (m[1] ?? '').trim() || null : null;
}

/**
 * 값 앞에 붙은 라벨용 괄호("(법인명) :", "(단체명) :")만 제거한다.
 * 회사명 일부인 "(주)샘플기업"의 "(주)"는 콜론이 뒤따르지 않으므로 보존된다.
 */
function stripParenLabel(value: string | null): string | null {
    if (!value) return value;
    const m = value.match(/^\s*\([^)]*\)\s*[:：]\s*(.+)$/);
    return m ? (m[1] ?? '').trim() || value : value;
}

/**
 * predicate를 만족하는 줄을 찾아 콜론 뒤 값을 반환한다.
 * 갉아먹힌 라벨("호:", "명:", "소재지 :") 보조 매칭에 사용.
 */
function findLineValueByColon(
    lines: string[],
    predicate: (line: string) => boolean,
): string | null {
    for (const raw of lines) {
        const line = raw.trim();
        if (!predicate(line)) continue;
        const value = valueAfterColon(line);
        if (value) return value;
    }
    return null;
}

export function parseBusinessDocument(rawText: string): BusinessDocumentParsedFields {
    const lines = rawText.split(/\n|\r\n|\r/).filter((l) => l.trim().length > 0);

    // ── 사업자번호 ──────────────────────────────────────────────────
    const businessNumberMatch = rawText.match(BUSINESS_NUMBER_RE);
    const businessNumber = businessNumberMatch ? businessNumberMatch[0] : null;

    // ── 개업일자 ────────────────────────────────────────────────────
    // "개업" 또는 "업연월일"(개업연월일/매업연월일 오인식 포함)이 있는 줄에서만 추출.
    // 생년월일·발급일·배경 노이즈를 잡지 않도록 전역 8자리 fallback은 쓰지 않는다.
    const startDateLine = lines.find((l) => /개\s*업|업\s*연\s*월\s*일/.test(l));
    const startDate = startDateLine ? extractDate(startDateLine) : null;

    // ── 상호명 ──────────────────────────────────────────────────────
    // 개인: "상호(단체명)", 법인: "법인명(단체명)" → 갉아먹힌 "호:" 보조 매칭
    // 값 앞 라벨 괄호("(법인명) :", "(단체명) :")는 stripParenLabel로 제거
    const businessName = stripParenLabel(
        extractByKeyword(lines, '상호(단체명)') ??
            extractByKeyword(lines, '상호명') ??
            extractByKeyword(lines, '상호') ??
            extractByKeyword(lines, '법인명') ??
            findLineValueByColon(lines, (l) => /^(?:상\s*)?호\s*[:：]/.test(l)),
    );

    // ── 대표자명 ────────────────────────────────────────────────────
    // "성명(대표자)", "대표자성명", "성명", "대표자" → 깨지거나 띄어쓰인 라벨 보조 매칭
    // "명:"(상호 갉아먹힘), "대표 자:"(띄어 읽힘), "대 Ⅱ 자:"(표 글자 깨짐) 모두 허용.
    // 대표자 패턴 /대\s*\S?\s*자/ — 대·자 사이 한 글자가 깨져도 매칭. ("생년월일"은 앵커로 걸러짐)
    const ownerName =
        extractByKeyword(lines, '성명(대표자)') ??
        extractByKeyword(lines, '대표자성명') ??
        extractByKeyword(lines, '성명') ??
        extractByKeyword(lines, '대표자') ??
        findLineValueByColon(lines, (l) => /^(?:성\s*명|대\s*\S?\s*자|명)\s*[:：]/.test(l));

    // ── 사업장주소 ───────────────────────────────────────────────────
    // 콜론 기반 추출 우선(라벨 완전 제거: "사업장 소재지:" → 값) → 콜론 없는 레이아웃은 키워드 fallback
    const businessAddress =
        findLineValueByColon(lines, (l) => /소\s*재\s*지/.test(l)) ??
        extractByKeyword(lines, '사업장소재지') ??
        extractByKeyword(lines, '사업장 주소') ??
        extractByKeyword(lines, '사업장');

    return {
        businessNumber,
        ownerName: ownerName ?? null,
        businessName: businessName ?? null,
        businessAddress: businessAddress ?? null,
        startDate,
    };
}
